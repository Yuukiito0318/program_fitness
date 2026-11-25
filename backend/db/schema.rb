# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_25_154716) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "account_suspensions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "suspended_by_id", null: false
    t.text "internal_note"
    t.datetime "starts_at", null: false
    t.datetime "ends_at"
    t.datetime "lifted_at"
    t.bigint "lifted_by_id"
    t.text "lift_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "user_reason"
    t.index ["lifted_by_id"], name: "index_account_suspensions_on_lifted_by_id"
    t.index ["suspended_by_id"], name: "index_account_suspensions_on_suspended_by_id"
    t.index ["user_id", "lifted_at"], name: "index_account_suspensions_on_user_id_and_lifted_at"
    t.index ["user_id"], name: "index_account_suspensions_on_user_id"
  end

  create_table "admin_audit_logs", force: :cascade do |t|
    t.bigint "admin_user_id", null: false
    t.string "action", null: false
    t.string "target_type"
    t.bigint "target_id"
    t.jsonb "metadata", default: {}, null: false
    t.string "ip_address"
    t.datetime "created_at", null: false
    t.index ["admin_user_id"], name: "index_admin_audit_logs_on_admin_user_id"
    t.index ["created_at"], name: "index_admin_audit_logs_on_created_at"
    t.index ["target_type", "target_id", "created_at"], name: "idx_on_target_type_target_id_created_at_2f2b396b88"
  end

  create_table "admin_sessions", force: :cascade do |t|
    t.bigint "admin_user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_user_id"], name: "index_admin_sessions_on_admin_user_id"
  end

  create_table "admin_users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.string "name", null: false
    t.boolean "personal_info_access", default: false, null: false
    t.datetime "disabled_at"
    t.datetime "last_login_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "user_management_access", default: false, null: false
    t.boolean "news_management_access", default: false, null: false
    t.index ["email_address"], name: "index_admin_users_on_email_address", unique: true
  end

  create_table "favorites", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "program_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["program_id"], name: "index_favorites_on_program_id"
    t.index ["user_id", "program_id"], name: "index_favorites_on_user_id_and_program_id", unique: true
    t.index ["user_id"], name: "index_favorites_on_user_id"
  end

  create_table "news_articles", force: :cascade do |t|
    t.string "title", null: false
    t.text "body", null: false
    t.string "category", null: false
    t.string "status", default: "draft", null: false
    t.datetime "published_at"
    t.bigint "created_by_id", null: false
    t.bigint "updated_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "content_updated_at"
    t.index ["created_by_id"], name: "index_news_articles_on_created_by_id"
    t.index ["status", "published_at"], name: "index_news_articles_on_status_and_published_at"
    t.index ["updated_by_id"], name: "index_news_articles_on_updated_by_id"
  end

  create_table "program_days", force: :cascade do |t|
    t.bigint "program_id", null: false
    t.integer "position", null: false
    t.string "name", null: false
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["program_id", "position"], name: "index_program_days_on_program_id_and_position"
    t.index ["program_id"], name: "index_program_days_on_program_id"
  end

  create_table "program_exercises", force: :cascade do |t|
    t.bigint "program_day_id", null: false
    t.integer "position", null: false
    t.string "name", null: false
    t.integer "sets"
    t.string "reps"
    t.string "weight"
    t.string "rest"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["program_day_id", "position"], name: "index_program_exercises_on_program_day_id_and_position"
    t.index ["program_day_id"], name: "index_program_exercises_on_program_day_id"
  end

  create_table "programs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "status", default: "draft", null: false
    t.string "title", null: false
    t.text "description"
    t.text "target_audience"
    t.text "equipment"
    t.string "category"
    t.integer "duration_value"
    t.string "duration_unit"
    t.string "split_method"
    t.integer "price"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "published_at"
    t.index ["status", "published_at"], name: "index_programs_on_status_and_published_at"
    t.index ["user_id", "updated_at"], name: "index_programs_on_user_id_and_updated_at"
    t.index ["user_id"], name: "index_programs_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "email_verified_at"
    t.string "nickname"
    t.text "bio"
    t.date "birth_date", null: false
    t.date "training_started_on", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "account_suspensions", "admin_users", column: "lifted_by_id"
  add_foreign_key "account_suspensions", "admin_users", column: "suspended_by_id"
  add_foreign_key "account_suspensions", "users"
  add_foreign_key "admin_audit_logs", "admin_users"
  add_foreign_key "admin_sessions", "admin_users", on_delete: :cascade
  add_foreign_key "favorites", "programs", on_delete: :cascade
  add_foreign_key "favorites", "users", on_delete: :cascade
  add_foreign_key "news_articles", "admin_users", column: "created_by_id"
  add_foreign_key "news_articles", "admin_users", column: "updated_by_id"
  add_foreign_key "program_days", "programs", on_delete: :cascade
  add_foreign_key "program_exercises", "program_days", on_delete: :cascade
  add_foreign_key "programs", "users"
  add_foreign_key "sessions", "users"
end
