FRONTEND_DIR := frontend
BACKEND_DIR := backend
APACHE_DIR := apache

FRONTEND_PORT := 8000
PUBLIC_DIR := /home/studs/s502875/public_html

HTTPD := /usr/local/sbin/httpd
APACHE_CONF := $(abspath $(APACHE_DIR)/httpd.conf)
APACHE_PID := $(abspath $(APACHE_DIR)/run/httpd.pid)


.PHONY: help \
        dev-frontend dev-backend \
        build clean start-backend \
        deploy-frontend \
        prepare-apache apache-check start-apache stop-apache restart-apache status-apache \
        check-backend check-apache check-site


# ============================================================
# Help
# ============================================================

help:
	@echo "Development:"
	@echo "  make dev-frontend     Start frontend on localhost:8000"
	@echo "  make dev-backend      Start Quarkus dev server on localhost:8080"
	@echo ""
	@echo "Backend:"
	@echo "  make build            Build Quarkus application"
	@echo "  make clean            Clean backend build files"
	@echo "  make start-backend    Start production Quarkus backend on 127.0.0.1:24001"
	@echo ""
	@echo "Frontend deployment (Helios):"
	@echo "  make deploy-frontend  Copy frontend files directly to ~/public_html"
	@echo ""
	@echo "Apache / Helios:"
	@echo "  make apache-check     Check Apache configuration"
	@echo "  make start-apache     Start Apache on port 24000"
	@echo "  make stop-apache      Stop Apache"
	@echo "  make restart-apache   Restart Apache"
	@echo "  make status-apache    Show Apache status"
	@echo ""
	@echo "Checks:"
	@echo "  make check-backend    Request Quarkus directly on port 24001"
	@echo "  make check-apache     Request API through Apache on port 24000"
	@echo "  make check-site       Request frontend through Apache on port 24000"


# ============================================================
# Local development — macOS
# ============================================================

dev-frontend:
	cd $(FRONTEND_DIR) && python3 -m http.server $(FRONTEND_PORT)


dev-backend:
	cd $(BACKEND_DIR) && ./mvnw quarkus:dev


# ============================================================
# Backend
# ============================================================

build:
	cd $(BACKEND_DIR) && ./mvnw package


clean:
	cd $(BACKEND_DIR) && ./mvnw clean


start-backend:
	cd $(BACKEND_DIR) && java -jar target/quarkus-app/quarkus-run.jar


# ============================================================
# Frontend deployment — Helios
# ============================================================

# The university web server requires static files to live directly in
# /home/studs/s502875/public_html. We keep sources in frontend/ and copy
# the current frontend there after git pull.
deploy-frontend:
	@test -d "$(PUBLIC_DIR)" || (echo "Directory $(PUBLIC_DIR) does not exist" && exit 1)
	cp -R $(FRONTEND_DIR)/. $(PUBLIC_DIR)/
	@echo "Frontend deployed to $(PUBLIC_DIR)"


# ============================================================
# Apache / Helios
# ============================================================

prepare-apache:
	mkdir -p $(APACHE_DIR)/logs $(APACHE_DIR)/run


apache-check: prepare-apache
	$(HTTPD) -f $(APACHE_CONF) -t


start-apache: prepare-apache
	$(HTTPD) -f $(APACHE_CONF) -k start


stop-apache:
	$(HTTPD) -f $(APACHE_CONF) -k stop


restart-apache: prepare-apache
	$(HTTPD) -f $(APACHE_CONF) -k restart


status-apache:
	@if [ -f "$(APACHE_PID)" ] && kill -0 $$(cat "$(APACHE_PID)") 2>/dev/null; then \
		echo "Apache is running (PID $$(cat "$(APACHE_PID)"))"; \
	else \
		echo "Apache is not running"; \
	fi


# ============================================================
# HTTP checks — Helios
# ============================================================

check-backend:
	curl -i 'http://127.0.0.1:24001/api/results'


check-apache:
	curl -i 'http://127.0.0.1:24000/api/results'


check-site:
	curl -I 'http://127.0.0.1:24000/'
