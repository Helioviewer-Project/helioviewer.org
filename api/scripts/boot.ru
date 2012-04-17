#!/usr/bin/env ruby
require 'resque/server'

AUTH_USER = ENV['USER'] # || 'user'
AUTH_PASS = ENV['PASS'] # || 'password'

if AUTH_PASS
  Resque::Server.use Rack::Auth::Basic do |username, password|
    username == AUTH_USER && password == AUTH_PASS
  end
end

Rack::Handler::Mongrel.run Rack::URLMap.new({
  "/" => Resque::Server.new
}), :Port => 4567
