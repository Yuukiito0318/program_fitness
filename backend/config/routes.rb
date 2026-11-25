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

    # Public programs: search and detail (published only, no login required)
    resources :programs, only: %i[index show]                            # /api/programs

    # Admin (operator) APIs. Every action requires an operator login (Api::Admin::BaseController).
    namespace :admin do
      resource :session, only: %i[show create destroy]                 # /api/admin/session
      resource :dashboard, only: :show                                 # /api/admin/dashboard
      resources :users, only: %i[index show] do                        # /api/admin/users
        resource :suspension, only: %i[create destroy]                 # /api/admin/users/:user_id/suspension
      end
      resources :news, only: %i[index show create update] do           # /api/admin/news
        resource :publication, only: %i[create destroy], controller: "news_publications"  # /api/admin/news/:news_id/publication
      end
    end

    # Public news (published only, no login required)
    resources :news, only: %i[index show]                              # /api/news

    # The logged-in user's own data
    namespace :my do
      resources :programs, only: %i[index show create update destroy]   # /api/my/programs
      resources :favorites, only: %i[index create destroy], param: :program_id  # /api/my/favorites
    end
  end
end
