import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";

import Header from "../../components/Header";
import Comments from "../../components/Utterances/Comments";

import Prismic from "@prismicio/client";
import { getPrismicClient } from "../../services/prismic";
import { RichText } from "prismic-dom";

import { formatDate, formatDateLastPublication } from "../../utils/formatDate";

import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import commonStyles from "../../styles/common.module.scss";
import styles from "./post.module.scss";

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    uid: string;
    title: string;
    subtitle: string;
    author: string;
    banner: {
      url: string;
    };
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(" ").length;

    const wordsBody = contentItem.body.reduce((totalWordsBody, paragraph) => {
      totalWordsBody += paragraph.text.split(" ").length;

      return totalWordsBody;
    }, 0);

    total += wordsBody;

    return total;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>Post | spacetraveling.</title>
      </Head>

      <Header />

      <main className={styles.container}>
        <img src={post.data.banner.url} alt="Banner Post" />

        <article className={commonStyles.content}>
          <h1>{post.data.title}</h1>

          <div className={styles.headContent}>
            <time>
              <FiCalendar />
              {formatDate(post.first_publication_date)}
            </time>

            <p>
              <FiUser />
              {post.data.author}
            </p>

            <p>
              <FiClock />
              {`${readingTime} min`}
            </p>
          </div>

          <time className={styles.lastPublicationDate}>
            {formatDateLastPublication(post.last_publication_date)}
          </time>

          {post.data.content.map((content) => (
            <article key={content.heading} className={styles.textContent}>
              <h2>{content.heading}</h2>

              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </article>
      </main>

      <Comments />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at("document.type", "posts"),
  ]);

  const paths = posts.results.map((post) => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID("posts", String(slug), {});

  const { uid, first_publication_date, last_publication_date } = response;
  const { title, subtitle, banner, author, content } = response.data;

  const post = {
    uid,
    first_publication_date,
    last_publication_date,
    data: {
      title,
      subtitle,
      author,
      banner: {
        url: banner.url,
      },
      content: content.map((content) => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutes
  };
};
