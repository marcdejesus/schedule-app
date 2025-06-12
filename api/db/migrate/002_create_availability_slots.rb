class CreateAvailabilitySlots < ActiveRecord::Migration[7.0]
  def change
    create_table :availability_slots do |t|
      t.references :user, null: false, foreign_key: true
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.boolean :recurring, default: false, null: false
      t.text :notes

      t.timestamps
    end

    add_index :availability_slots, :user_id
    add_index :availability_slots, :start_time
    add_index :availability_slots, :end_time
    add_index :availability_slots, [:user_id, :start_time]
    add_index :availability_slots, :recurring
  end
end 