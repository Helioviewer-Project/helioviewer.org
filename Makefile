.PHONY: help build watch ant test pretty pretty-check shell

NODE_BIN = /root/.nvm/versions/node/v18.16.0/bin
.DEFAULT_GOAL := help

help:
	@echo "Available targets:"
	@echo "  build         Build webpack modules in development mode (resources/js/dist/HelioviewerModules.js)"
	@echo "  watch         Same as build, but watches for changes"
	@echo "  ant           Run legacy ant build (regenerates resources/compressed/helioviewer.min.js)"
	@echo "  test          Run the jest tests (npm test)"
	@echo "  pretty        Format JS with prettier (write mode)"
	@echo "  pretty-check  Check JS formatting with prettier (no write — same as CI)"
	@echo "  shell         Open an interactive bash shell inside the 'web' container (as your host user, node/npm on PATH)"
	@echo ""
	@echo "All targets run inside the 'web' docker container."

shell:
	cd .. && docker compose exec -u $$(id -u):$$(id -g) -e HOME=/tmp -e PATH=$(NODE_BIN):/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin -w /var/www/html web bash

build:
	cd .. && docker compose exec web bash -c "export PATH=$(NODE_BIN):$$PATH && cd /var/www/html/resources/build && npx webpack --mode=development"

watch:
	cd .. && docker compose exec web bash -c "export PATH=$(NODE_BIN):$$PATH && cd /var/www/html/resources/build && npx webpack watch --mode=development"

ant:
	cd .. && docker compose exec web bash -c "export PATH=$(NODE_BIN):$$PATH && cd /var/www/html && ant -f resources/build/build.xml build"

test:
	cd .. && docker compose exec web bash -c "export PATH=$(NODE_BIN):$$PATH && cd /var/www/html && npm test"

pretty:
	cd .. && docker compose exec web bash -c "export PATH=$(NODE_BIN):$$PATH && cd /var/www/html && npm run prettier"

pretty-check:
	cd .. && docker compose exec web bash -c "export PATH=$(NODE_BIN):$$PATH && cd /var/www/html && npm run prettier-check"
