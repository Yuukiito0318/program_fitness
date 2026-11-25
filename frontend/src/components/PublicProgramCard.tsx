import { Link } from 'react-router'
import {
  CATEGORY_LABELS,
  formatDuration,
  formatPrice,
  type PublicProgramCard as Card,
} from '../types/program'
import { FavoriteButton } from './FavoriteButton'

type Props = {
  program: Card
  onFavoriteChange?: (favorited: boolean) => void
}

export function PublicProgramCard({ program: p, onFavoriteChange }: Props) {
  const duration = formatDuration(p.duration_value, p.duration_unit)
  return (
    <li className="card program-card">
      <Link to={`/programs/${p.id}`} className="program-card-link">
        <div className="tags">
          {p.category && <span className="tag">{CATEGORY_LABELS[p.category]}</span>}
          {duration && <span className="tag">{duration}</span>}
          {p.split_method && <span className="tag">{p.split_method}</span>}
        </div>
        <div className="program-card-title">{p.title}</div>
        <p className="meta">
          {p.creator.nickname ?? '名前未設定'}（トレーニング歴{p.creator.training_years}年） ・ {p.days_count}日・
          {p.exercises_count}種目
        </p>
        <p className="program-card-price">{formatPrice(p.price) ?? '価格未設定'}</p>
      </Link>
      <div className="program-card-actions">
        <FavoriteButton programId={p.id} favorited={p.favorited} onChange={onFavoriteChange} />
      </div>
    </li>
  )
}
