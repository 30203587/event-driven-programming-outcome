set -ex
unset DISPLAY

plantuml design/diagrams/use-case.puml -Tsvg -o ../../target

# plantuml design/diagrams/*.puml -Tsvg -o ../../target
# pandoc -t html design/individual/document.md -o target/document.pdf
