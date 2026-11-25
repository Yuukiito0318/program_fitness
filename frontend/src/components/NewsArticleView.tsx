import { formatNewsDate, NEWS_CATEGORY_LABELS, type NewsCategory } from '../types/news'

/**
 * News article view, shared by the user detail page and the admin preview.
 * Shows the posting date (掲載日) and, if the content was edited after publishing, the update date (更新日).
 * The body is plain text and is rendered as text (never as HTML), so it cannot inject scripts.
 */
export function NewsArticleView(props: {
  title: string
  category: NewsCategory
  publishedAt: string | null
  updatedAt?: string | null
  body: string
}) {
  return (
    <article className="card news-article">
      <div className="news-meta">
        <span className={`news-category ${props.category}`}>{NEWS_CATEGORY_LABELS[props.category]}</span>
        {props.publishedAt ? (
          <span>
            掲載日 <time dateTime={props.publishedAt}>{formatNewsDate(props.publishedAt)}</time>
          </span>
        ) : (
          <span className="muted">未公開</span>
        )}
        {props.updatedAt && (
          <span>
            更新日 <time dateTime={props.updatedAt}>{formatNewsDate(props.updatedAt)}</time>
          </span>
        )}
      </div>
      <h1 className="news-article-title">{props.title}</h1>
      <div className="news-body">{props.body}</div>
    </article>
  )
}
