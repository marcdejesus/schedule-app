# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts "🌱 Seeding database..."

# Create sample admin user
admin = User.find_or_create_by(email: 'admin@scheduleease.com') do |user|
  user.name = 'Admin User'
  user.password = 'password123'
  user.role = 'admin'
  user.timezone = 'UTC'
end

puts "✅ Created admin user: #{admin.email}"

# Create sample provider
provider = User.find_or_create_by(email: 'provider@scheduleease.com') do |user|
  user.name = 'Dr. Sarah Johnson'
  user.password = 'password123'
  user.role = 'provider'
  user.timezone = 'America/New_York'
end

puts "✅ Created provider: #{provider.email}"

# Create sample client
client = User.find_or_create_by(email: 'client@scheduleease.com') do |user|
  user.name = 'John Doe'
  user.password = 'password123'
  user.role = 'client'
  user.timezone = 'America/Los_Angeles'
end

puts "✅ Created client: #{client.email}"

# Create sample availability slots for the provider
if provider.availability_slots.empty?
  # Monday to Friday, 9 AM to 5 PM
  (1..5).each do |day_offset|
    date = Date.current.beginning_of_week + day_offset.days
    
    # Morning slot: 9 AM - 12 PM
    provider.availability_slots.create!(
      start_time: date.beginning_of_day + 9.hours,
      end_time: date.beginning_of_day + 12.hours,
      recurring: false
    )
    
    # Afternoon slot: 1 PM - 5 PM
    provider.availability_slots.create!(
      start_time: date.beginning_of_day + 13.hours,
      end_time: date.beginning_of_day + 17.hours,
      recurring: false
    )
  end
  
  puts "✅ Created #{provider.availability_slots.count} availability slots for #{provider.name}"
end

# Create sample appointment
if Appointment.count == 0
  appointment = Appointment.create!(
    provider: provider,
    client: client,
    start_time: Date.current.next_weekday.beginning_of_day + 10.hours,
    end_time: Date.current.next_weekday.beginning_of_day + 11.hours,
    status: 'confirmed',
    notes: 'Initial consultation'
  )
  
  puts "✅ Created sample appointment between #{provider.name} and #{client.name}"
end

puts "🎉 Database seeding completed!"
puts ""
puts "Sample accounts created:"
puts "👑 Admin: admin@scheduleease.com / password123"
puts "👨‍⚕️ Provider: provider@scheduleease.com / password123"
puts "👤 Client: client@scheduleease.com / password123" 