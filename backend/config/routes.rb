Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # All JSON endpoints for the frontend live under /api.
  namespace :api do
    get "health", to: "health#show"

    # Account
    resource :registration, only: :create                     # POST   /api/registration
    resource :session, only: %i[show create destroy]          # GET/POST/DELETE /api/session
    resource :email_verification, only: :create do            # POST   /api/email_verification
      post :resend                                             # POST   /api/email_verification/resend
    end
    resource :password_reset, only: %i[create update]         # POST/PATCH /api/password_reset
    resource :profile, only: %i[show update]                  # GET/PATCH  /api/profile
    resource :password, only: :update                         # PATCH  /api/password

    # The logged-in user's own programs (drafts only for now)
    namespace :my do
      resources :programs, only: %i[index show create update destroy]   # /api/my/programs
    end
  end
end
