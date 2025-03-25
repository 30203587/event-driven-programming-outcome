set -ex
unset DISPLAY

plantuml design/state.puml -Tsvg -o ../target    &
plantuml design/use-case.puml -Tsvg -o ../target &

wait

pandoc -t html design/document.md -o target/document.pdf
