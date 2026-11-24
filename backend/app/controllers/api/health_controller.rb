# Development-only connectivity check used by the frontend top page.
# It is not an application feature: it only reports whether Rails is up
# and whether it can reach PostgreSQL.
module Api
  class HealthController < ApplicationController
    allow_unauthenticated_access

    def show
      database = begin
        ActiveRecord::Base.connection.select_value("SELECT 1")
        "ok"
      rescue StandardError => e
        Rails.logger.error("[health] database check failed: #{e.class}: #{e.message}")
        "error"
      end

      render json: {
        status: "ok",
        database: database,
        rails_env: Rails.env,
        time: Time.current.iso8601
      }, status: database == "ok" ? :ok : :service_unavailable
    end
  end
end
