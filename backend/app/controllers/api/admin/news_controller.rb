# Operator news management (operator login required via BaseController).
# create / update need the news management permission (checked here on the server).
#
# GET    /api/admin/news                  一覧（status / category / page）
# POST   /api/admin/news                  作成（非公開で作成）
# GET    /api/admin/news/:id              詳細（公開前プレビュー用）
# PATCH  /api/admin/news/:id              編集（公開中でも編集でき、ユーザー画面に即反映）
# POST   /api/admin/news/:id/publication  公開
# DELETE /api/admin/news/:id/publication  非公開（ユーザー画面から即非表示）
#
# Every change is recorded in the operator action log.
module Api
  module Admin
    class NewsController < BaseController
      PER_PAGE = 20

      # Viewing (index / show) is open to every operator; changes need the news management permission.
      before_action :require_news_management_access!, only: %i[create update]
      before_action :set_article, only: %i[show update]

      def index
        articles = NewsArticle.includes(:created_by, :updated_by).order(updated_at: :desc, id: :desc)
        articles = articles.where(status: params[:status]) if NewsArticle.statuses.key?(params[:status])
        articles = articles.where(category: params[:category]) if NewsArticle::CATEGORIES.key?(params[:category])

        total = articles.count
        page = [ params[:page].to_i, 1 ].max
        records = articles.offset((page - 1) * PER_PAGE).limit(PER_PAGE)
        render json: {
          articles: records.map { |a| article_json(a, body: false) },
          total: total, page: page, per_page: PER_PAGE, total_pages: (total.to_f / PER_PAGE).ceil
        }
      end

      def show
        render json: { article: article_json(@article) }
      end

      def create
        article = NewsArticle.new(article_params.merge(created_by: current_admin, updated_by: current_admin))
        if article.save
          audit!("create_news", article, { title: article.title })
          render json: { article: article_json(article) }, status: :created
        else
          render json: { errors: article.errors.to_hash(true) }, status: :unprocessable_content
        end
      end

      def update
        if @article.update(article_params.merge(updated_by: current_admin))
          audit!("update_news", @article, { title: @article.title, status: @article.status })
          render json: { article: article_json(@article) }
        else
          render json: { errors: @article.errors.to_hash(true) }, status: :unprocessable_content
        end
      end

      private
        def set_article
          @article = NewsArticle.includes(:created_by, :updated_by).find_by(id: params[:id])
          render json: { error: "ニュースが見つかりません。" }, status: :not_found unless @article
        end

        def article_params
          params.expect(article: [ :title, :body, :category ])
        end

        def article_json(a, body: true)
          json = {
            id: a.id,
            title: a.title,
            category: a.category,
            status: a.status,
            published_at: a.published_at&.iso8601,
            content_updated_at: a.public_updated_at&.iso8601,  # 公開後の更新（ユーザー画面の更新日）
            created_at: a.created_at.iso8601,
            updated_at: a.updated_at.iso8601,
            created_by: a.created_by.name,
            updated_by: a.updated_by.name
          }
          json[:body] = a.body if body
          json[:can_manage] = current_admin.news_management_access?
          json
        end
    end
  end
end
