class ApplicationController < ActionController::API
  # API mode does not include cookie support by default; the login session uses a signed cookie.
  include ActionController::Cookies
  include Authentication

  # CSRF protection for cookie-authenticated requests.
  # Browsers cannot attach a custom header to a cross-site form submission, and a cross-site
  # fetch() with a custom header needs a CORS preflight, which this API does not allow.
  # So any state-changing request must carry this header (the frontend api helper adds it).
  CSRF_HEADER = "X-Requested-With"
  CSRF_HEADER_VALUE = "XMLHttpRequest"

  before_action :verify_csrf_header

  rescue_from ActionController::ParameterMissing do |e|
    render json: { error: "必須項目が不足しています: #{e.param}" }, status: :bad_request
  end

  private
    def verify_csrf_header
      return if request.get? || request.head?
      return if request.headers[CSRF_HEADER] == CSRF_HEADER_VALUE

      render json: { error: "不正なリクエストです。" }, status: :forbidden
    end

    def render_validation_errors(record)
      render json: { errors: record.errors.to_hash(true) }, status: :unprocessable_content
    end

    def render_rate_limited
      render json: { error: "試行回数が多すぎます。しばらく待ってから再度お試しください。" }, status: :too_many_requests
    end
end
