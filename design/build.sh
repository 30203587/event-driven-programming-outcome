set -ex
unset DISPLAY

plantuml design/state.puml design/use-case.puml -Tsvg -o ../target &
pandoc -t html design/document.md -o target/document.pdf
