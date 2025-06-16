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

ActiveRecord::Schema[7.1].define(version: 2025_06_16_141041) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "appointments", force: :cascade do |t|
    t.bigint "provider_id", null: false
    t.bigint "client_id", null: false
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.integer "status", default: 0, null: false
    t.text "notes"
    t.text "cancellation_reason"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["client_id", "start_time"], name: "index_appointments_on_client_id_and_start_time"
    t.index ["client_id"], name: "index_appointments_on_client_id"
    t.index ["end_time"], name: "index_appointments_on_end_time"
    t.index ["provider_id", "start_time"], name: "index_appointments_on_provider_id_and_start_time"
    t.index ["provider_id"], name: "index_appointments_on_provider_id"
    t.index ["start_time"], name: "index_appointments_on_start_time"
    t.index ["status"], name: "index_appointments_on_status"
  end

  create_table "availability_slots", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.datetime "start_time", null: false
    t.datetime "end_time", null: false
    t.boolean "recurring", default: false, null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["end_time"], name: "index_availability_slots_on_end_time"
    t.index ["recurring"], name: "index_availability_slots_on_recurring"
    t.index ["start_time"], name: "index_availability_slots_on_start_time"
    t.index ["user_id", "start_time"], name: "index_availability_slots_on_user_id_and_start_time"
    t.index ["user_id"], name: "index_availability_slots_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.bigint "user_id", null: false
    t.text "message", null: false
    t.integer "notification_type", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.datetime "sent_at"
    t.integer "retry_count", default: 0, null: false
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id"], name: "index_notifications_on_appointment_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["sent_at"], name: "index_notifications_on_sent_at"
    t.index ["status"], name: "index_notifications_on_status"
    t.index ["user_id", "status"], name: "index_notifications_on_user_id_and_status"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "user_preferences", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.boolean "email_notifications", default: true
    t.boolean "appointment_reminders", default: true
    t.boolean "booking_confirmations", default: true
    t.string "notification_frequency", default: "immediate"
    t.string "theme", default: "system"
    t.string "font_size", default: "medium"
    t.boolean "high_contrast", default: false
    t.boolean "reduced_motion", default: false
    t.boolean "screen_reader", default: false
    t.string "language", default: "en"
    t.string "date_format", default: "MM/DD/YYYY"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_user_preferences_on_user_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "name", null: false
    t.integer "role", default: 0, null: false
    t.string "timezone", default: "UTC", null: false
    t.string "phone_number"
    t.string "provider_id"
    t.string "uid"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.text "bio"
    t.string "avatar_url"
    t.text "specialties"
    t.text "social_links"
    t.string "custom_booking_slug"
    t.index ["avatar_url"], name: "index_users_on_avatar_url", where: "(avatar_url IS NOT NULL)"
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["custom_booking_slug"], name: "index_users_on_custom_booking_slug", unique: true, where: "(custom_booking_slug IS NOT NULL)"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider_id", "uid"], name: "index_users_on_provider_id_and_uid", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "appointments", "users", column: "client_id"
  add_foreign_key "appointments", "users", column: "provider_id"
  add_foreign_key "availability_slots", "users"
  add_foreign_key "notifications", "appointments"
  add_foreign_key "notifications", "users"
  add_foreign_key "user_preferences", "users"
end
