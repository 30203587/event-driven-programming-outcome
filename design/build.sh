set -ex
unset DISPLAY

plantuml design/use-case-diagram.puml -Tsvg -o ../target
pandoc -t html design/document.md -o target/document.pdf
