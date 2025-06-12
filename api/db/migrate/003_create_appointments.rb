class CreateAppointments < ActiveRecord::Migration[7.0]
  def change
    create_table :appointments do |t|
      t.references :provider, null: false, foreign_key: { to_table: :users }
      t.references :client, null: false, foreign_key: { to_table: :users }
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.integer :status, default: 0, null: false
      t.text :notes
      t.text :cancellation_reason

      t.timestamps
    end

    add_index :appointments, :provider_id
    add_index :appointments, :client_id
    add_index :appointments, :start_time
    add_index :appointments, :end_time
    add_index :appointments, :status
    add_index :appointments, [:provider_id, :start_time]
    add_index :appointments, [:client_id, :start_time]
  end
end 