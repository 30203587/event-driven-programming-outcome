set -ex
unset DISPLAY

convert -density 300 -define icon:auto-resize=256,128,96,64,48,32,16 -background none design/logo.svg icons/icon.ico

# plantuml design/state.puml -Tsvg -o ../target    &
# plantuml design/use-case.puml -Tsvg -o ../target &
#
# wait
#
# pandoc -t html design/document.md -o target/document.pdf
