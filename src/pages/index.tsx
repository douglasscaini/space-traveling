import { useState } from "react";
import { GetStaticProps } from "next";
import Link from "next/link";
import Head from "next/head";

import Prismic from "@prismicio/client";
import { getPrismicClient } from "../services/prismic";

import Header from "../components/Header";
import PreviewButton from "../components/PreviewButton/PreviewButton";

import { formatDate } from "../utils/formatDate";

import { FiCalendar, FiUser } from "react-icons/fi";

import commonStyles from "../styles/common.module.scss";
import styles from "./home.module.scss";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function handleLoadMorePosts() {
    fetch(nextPage)
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.results.map((post) => {
          const { uid, first_publication_date } = post;
          const { title, subtitle, author } = post.data;

          return {
            uid,
            first_publication_date,
            data: {
              title,
              subtitle,
              author,
            },
          };
        });

        setPosts([...posts, ...formattedData]);
        setNextPage(data.next_page);
      });
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>

      <Header />

      <main className={commonStyles.content}>
        {posts.map((post) => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h2>{post.data.title}</h2>
                <p>{post.data.subtitle}</p>
              </a>
            </Link>

            <div>
              <time>
                <FiCalendar />
                {formatDate(post.first_publication_date)}
              </time>

              <p>
                <FiUser />
                {post.data.author}
              </p>
            </div>
          </div>
        ))}

        {nextPage !== null && (
          <button onClick={handleLoadMorePosts}>Carregar mais posts</button>
        )}

        {preview && <PreviewButton />}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at("document.type", "posts")],
    { pageSize: 4, ref: previewData?.ref ?? null }
  );

  const posts = postsResponse.results.map((post) => {
    const { uid, first_publication_date } = post;
    const { title, subtitle, author } = post.data;

    return {
      uid,
      first_publication_date,
      data: {
        title,
        subtitle,
        author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
      preview,
    },
  };
};
