class CreateUserPreferences < ActiveRecord::Migration[7.1]
  def change
    create_table :user_preferences do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      
      # Notification preferences
      t.boolean :email_notifications, default: true
      t.boolean :appointment_reminders, default: true
      t.boolean :booking_confirmations, default: true
      t.string :notification_frequency, default: 'immediate' # immediate, daily, weekly
      
      # Theme and appearance preferences
      t.string :theme, default: 'system' # light, dark, system
      t.string :font_size, default: 'medium' # small, medium, large
      
      # Accessibility preferences
      t.boolean :high_contrast, default: false
      t.boolean :reduced_motion, default: false
      t.boolean :screen_reader, default: false
      
      # Language and localization
      t.string :language, default: 'en'
      t.string :date_format, default: 'MM/DD/YYYY'

      t.timestamps
    end
  end
end
