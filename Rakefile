# Output directory.
directory 'bin'

# Development binary.
source_files = Dir['src/next_editor/*.js'].sort
file 'bin/next_editor.js' => source_files do
  Kernel.system 'cat src/next_editor/*.js > bin/next_editor.js'
end

# Production binary.
file 'bin/next_editor.min.js' => 'bin/next_editor.js' do
  Kernel.system 'juicer merge --force bin/next_editor.js'
end

# Build everything by default.
task :default => 'bin/next_editor.min.js'

task :server do
  require 'rubygems'
  require 'webrick'
  
  server = WEBrick::HTTPServer.new :Port => 3000, :DocumentRoot => '.'
  ['INT', 'TERM'].each { |signal| trap(signal) { server.shutdown } }
  server.start
end
