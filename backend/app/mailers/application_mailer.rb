class ApplicationMailer < ActionMailer::Base
  # The mail delivery service is not selected yet. The sender address comes from MAIL_FROM.
  default from: -> { ENV.fetch("MAIL_FROM", "program fitness <no-reply@localhost>") }
  layout "mailer"

  private
    # Links in emails open pages of the frontend app (React), not Rails.
    def frontend_url(path, **query)
      base = ENV.fetch("FRONTEND_URL", "http://localhost:5173").chomp("/")
      url = "#{base}#{path}"
      query.empty? ? url : "#{url}?#{query.to_query}"
    end
end
