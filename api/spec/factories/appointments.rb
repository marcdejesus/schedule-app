FactoryBot.define do
  factory :appointment do
    association :provider, factory: [:user, :provider]
    association :client, factory: [:user, :client]
    start_time { 1.day.from_now.beginning_of_hour }
    end_time { 1.day.from_now.beginning_of_hour + 1.hour }
    status { :pending }
    notes { 'Test appointment notes' }

    trait :confirmed do
      status { :confirmed }
    end

    trait :cancelled do
      status { :cancelled }
      cancellation_reason { 'Schedule conflict' }
    end

    trait :completed do
      status { :completed }
      start_time { 1.day.ago.beginning_of_hour }
      end_time { 1.day.ago.beginning_of_hour + 1.hour }
    end

    trait :no_show do
      status { :no_show }
      start_time { 1.day.ago.beginning_of_hour }
      end_time { 1.day.ago.beginning_of_hour + 1.hour }
    end

    trait :past do
      start_time { 1.week.ago.beginning_of_hour }
      end_time { 1.week.ago.beginning_of_hour + 1.hour }
    end

    trait :upcoming do
      start_time { 1.week.from_now.beginning_of_hour }
      end_time { 1.week.from_now.beginning_of_hour + 1.hour }
    end

    trait :today do
      start_time { Time.current.beginning_of_day + 14.hours }
      end_time { Time.current.beginning_of_day + 15.hours }
    end

    trait :with_notes do
      notes { 'Important meeting notes and requirements' }
    end
  end
end 