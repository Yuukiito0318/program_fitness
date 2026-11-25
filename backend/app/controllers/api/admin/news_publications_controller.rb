# POST   /api/admin/news/:news_id/publication  公開
# DELETE /api/admin/news/:news_id/publication  非公開
module Api
  module Admin
    class NewsPublicationsController < BaseController
      before_action :require_news_management_access!
      before_action :set_article

      def create
        @article.publish!(current_admin)
        audit!("publish_news", @article, { title: @article.title })
        render json: { message: "ニュースを公開しました。", status: @article.status,
                       published_at: @article.published_at.iso8601 }
      end

      def destroy
        @article.unpublish!(current_admin)
        audit!("unpublish_news", @article, { title: @article.title })
        render json: { message: "ニュースを非公開にしました。", status: @article.status }
      end

      private
        def set_article
          @article = NewsArticle.find_by(id: params[:news_id])
          render json: { error: "ニュースが見つかりません。" }, status: :not_found unless @article
        end
    end
  end
end
