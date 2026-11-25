import { Link } from 'react-router'
import { formatNewsDate, NEWS_CATEGORY_LABELS, type NewsSummary } from '../types/news'

// List of public news (used on the home page and the news list page).
export function NewsList({ articles, showExcerpt = true }: { articles: NewsSummary[]; showExcerpt?: boolean }) {
  return (
    <ul className="news-list">
      {articles.map((a) => (
        <li key={a.id}>
          <Link to={`/news/${a.id}`} className="news-item">
            <div className="news-meta">
              <span className={`news-category ${a.category}`}>{NEWS_CATEGORY_LABELS[a.category]}</span>
              <time dateTime={a.published_at}>{formatNewsDate(a.published_at)}</time>
              {a.updated_at && (
                <span>
                  （更新 <time dateTime={a.updated_at}>{formatNewsDate(a.updated_at)}</time>）
                </span>
              )}
            </div>
            <div className="news-title">{a.title}</div>
            {showExcerpt && <p className="news-excerpt">{a.excerpt}</p>}
          </Link>
        </li>
      ))}
    </ul>
  )
}
