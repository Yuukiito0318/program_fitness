# Public news for users (no login required). Only published articles are ever returned:
# drafts / unpublished articles are excluded in the query, and their detail URL returns 404.
#
# GET /api/news       一覧（新しい順）category / month(YYYY-MM) / page / limit
# GET /api/news/:id   詳細
module Api
  class NewsController < ApplicationController
    PER_PAGE = 10
    EXCERPT_LENGTH = 100

    allow_unauthenticated_access

    def index
      articles = NewsArticle.publicly_visible.newest_first
      articles = articles.where(category: params[:category]) if NewsArticle::CATEGORIES.key?(params[:category])
      if (month = parse_month(params[:month]))
        articles = articles.where(published_at: month.beginning_of_month..month.end_of_month)
      end

      per_page = params[:limit].present? ? params[:limit].to_i.clamp(1, PER_PAGE) : PER_PAGE
      total = articles.count
      page = [ params[:page].to_i, 1 ].max
      records = articles.offset((page - 1) * per_page).limit(per_page)

      render json: {
        articles: records.map { |a| summary_json(a) },
        total: total, page: page, per_page: per_page, total_pages: (total.to_f / per_page).ceil
      }
    end

    def show
      article = NewsArticle.publicly_visible.find_by(id: params[:id])
      return render json: { error: "ニュースが見つかりません。" }, status: :not_found unless article

      render json: { article: summary_json(article).except(:excerpt).merge(body: article.body) }
    end

    private
      def parse_month(value)
        return unless value.to_s.match?(/\A\d{4}-\d{2}\z/)

        Time.zone.parse("#{value}-01")
      rescue ArgumentError
        nil
      end

      # No operator names or internal timestamps are exposed to users.
      def summary_json(a)
        {
          id: a.id,
          title: a.title,
          category: a.category,
          published_at: a.published_at.iso8601,          # 掲載日
          updated_at: a.public_updated_at&.iso8601,       # 更新日（公開後に編集された場合のみ）
          excerpt: a.body.gsub(/\s+/, " ").truncate(EXCERPT_LENGTH)
        }
      end
  end
end
