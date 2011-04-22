#! /usr/bin/env ruby1.8

bench_string = 'boom headshot '
bench_reps = 20
bench_cpm = 900

require 'rubygems'
require 'x_do'

xdo = XDo.new
browsers = xdo.find_windows(:name => 'NextEditor Benchmark')
if browsers.length != 1
  print "Wanted 1 benchmark window, found #{browsers.length}!\n"
  exit
end

browser = browsers.first
print 'Press Enter to start...'
gets

browser.type_keysequence 'Ctrl+R'
sleep 1
browser.activate
sleep 1

t0 = Time.now
bench_reps.times do
  browser.type_string bench_string, 60.0 / bench_cpm
end
t1 = Time.now
print "Finished in #{'%.2f' % (t1 - t0)}s\n"
