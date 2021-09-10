import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

import Header from "../../components/Header";
import Comments from "../../components/Utterances/Comments";
import PreviewButton from "../../components/PreviewButton/PreviewButton";

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
  preview: boolean;
  navigationItems?: {
    afterPost?: {
      uid: string;
      data: {
        title: string;
      };
    };
    beforePost?: {
      uid: string;
      data: {
        title: string;
      };
    };
  };
}

export default function Post({ post, preview, navigationItems }: PostProps) {
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

          <section>
            {navigationItems.beforePost && (
              <div>
                <h3>{navigationItems.beforePost.data.title}</h3>
                <Link href={`/post/${navigationItems.beforePost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}

            {navigationItems.afterPost && (
              <div>
                <h3>{navigationItems.afterPost.data.title}</h3>
                <Link href={`/post/${navigationItems.afterPost.uid}`}>
                  <a className={styles.rightLink}>Próximo post</a>
                </Link>
              </div>
            )}
          </section>

          <Comments />

          {preview && <PreviewButton />}
        </article>
      </main>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID("posts", String(slug), {
    ref: previewData?.ref ?? null,
  });

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

  const postsResponse = await prismic.query([
    Prismic.predicates.at("document.type", "posts"),
  ]);

  const postsFormattedData = postsResponse.results.map((post) => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
      },
    };
  });

  const currentPostPositionIndex = postsFormattedData.findIndex(
    (post) => post.uid === response.uid
  );

  const otherPosts = postsFormattedData.filter(
    (post, index) =>
      index === currentPostPositionIndex + 1 ||
      index === currentPostPositionIndex - 1
  );

  const navigationItems = {
    afterPost: otherPosts[0] ?? null,
    beforePost: otherPosts[1] ?? null,
  };

  return {
    props: {
      post,
      preview,
      navigationItems,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
