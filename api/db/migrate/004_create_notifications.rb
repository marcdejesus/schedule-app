class CreateNotifications < ActiveRecord::Migration[7.0]
  def change
    create_table :notifications do |t|
      t.references :appointment, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.text :message, null: false
      t.integer :notification_type, default: 0, null: false
      t.integer :status, default: 0, null: false
      t.datetime :sent_at
      t.integer :retry_count, default: 0, null: false
      t.text :error_message

      t.timestamps
    end

    add_index :notifications, :appointment_id
    add_index :notifications, :user_id
    add_index :notifications, :notification_type
    add_index :notifications, :status
    add_index :notifications, :sent_at
    add_index :notifications, [:user_id, :status]
  end
end 