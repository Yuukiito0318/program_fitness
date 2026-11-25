# GET /api/admin/dashboard  ユーザー総数・停止中ユーザー数
# (Other dashboard items in the spec — transactions, payments, pending tasks — are not implemented yet.)
module Api
  module Admin
    class DashboardsController < BaseController
      def show
        render json: {
          users: {
            total: User.count,
            suspended: User.suspended.count,
            new_last_7_days: User.where(created_at: 7.days.ago..).count
          }
        }
      end
    end
  end
end
