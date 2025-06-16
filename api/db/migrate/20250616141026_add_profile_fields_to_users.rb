class AddProfileFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :bio, :text
    add_column :users, :avatar_url, :string
    add_column :users, :specialties, :text
    add_column :users, :social_links, :text
    add_column :users, :custom_booking_slug, :string
    
    # Add unique index for custom booking slugs
    add_index :users, :custom_booking_slug, unique: true, where: 'custom_booking_slug IS NOT NULL'
    
    # Add index for avatar_url for faster lookups
    add_index :users, :avatar_url, where: 'avatar_url IS NOT NULL'
  end
end
