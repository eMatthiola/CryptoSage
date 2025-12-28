# ==================================
# CryptoSage AI - Makefile
# ==================================
# 便捷的开发命令集合

.PHONY: help setup start stop restart logs clean test build deploy

# 默认目标
.DEFAULT_GOAL := help

# 帮助信息
help:
	@echo "CryptoSage AI - 开发命令"
	@echo ""
	@echo "使用方法: make [命令]"
	@echo ""
	@echo "可用命令:"
	@echo "  setup       - 初始化项目（安装依赖）"
	@echo "  start       - 启动所有服务（Docker）"
	@echo "  stop        - 停止所有服务"
	@echo "  restart     - 重启所有服务"
	@echo "  logs        - 查看服务日志"
	@echo "  logs-f      - 实时查看日志"
	@echo "  clean       - 清理容器和数据卷"
	@echo "  test        - 运行测试"
	@echo "  build       - 构建 Docker 镜像"
	@echo "  migrate     - 运行数据库迁移"
	@echo "  shell-be    - 进入后端容器 shell"
	@echo "  shell-fe    - 进入前端容器 shell"
	@echo "  shell-db    - 进入数据库容器 shell"
	@echo "  dev-fe      - 本地运行前端（不用 Docker）"
	@echo "  dev-be      - 本地运行后端（不用 Docker）"
	@echo ""

# 初始化项目
setup:
	@echo "初始化项目..."
	@if not exist .env copy .env.example .env
	@echo "请编辑 .env 文件，填入你的 API Keys"
	@echo "然后运行: make start"

# 启动所有服务
start:
	@echo "启动所有服务..."
	docker-compose up -d
	@echo "服务已启动！"
	@echo "前端: http://localhost:3000"
	@echo "后端: http://localhost:8000"
	@echo "API 文档: http://localhost:8000/docs"

# 停止所有服务
stop:
	@echo "停止所有服务..."
	docker-compose down

# 重启所有服务
restart:
	@echo "重启所有服务..."
	docker-compose restart

# 查看日志
logs:
	docker-compose logs

# 实时查看日志
logs-f:
	docker-compose logs -f

# 清理容器和数据卷
clean:
	@echo "清理所有容器和数据卷..."
	docker-compose down -v
	@echo "已清理！"

# 运行测试
test:
	@echo "运行后端测试..."
	docker-compose exec backend pytest
	@echo "运行前端测试..."
	docker-compose exec frontend npm test

# 构建 Docker 镜像
build:
	@echo "构建 Docker 镜像..."
	docker-compose build

# 数据库迁移
migrate:
	@echo "运行数据库迁移..."
	docker-compose exec backend alembic upgrade head

# 进入后端容器
shell-be:
	docker-compose exec backend /bin/bash

# 进入前端容器
shell-fe:
	docker-compose exec frontend /bin/sh

# 进入数据库容器
shell-db:
	docker-compose exec postgres psql -U postgres -d cryptosage

# 本地运行前端（不用 Docker）
dev-fe:
	@echo "启动前端开发服务器..."
	cd frontend && npm run dev

# 本地运行后端（不用 Docker）
dev-be:
	@echo "启动后端开发服务器..."
	cd backend && venv\Scripts\activate && uvicorn app.main:app --reload

# 仅启动数据库服务（用于本地开发）
dev-db:
	@echo "启动数据库服务..."
	docker-compose up -d postgres redis qdrant

# 格式化代码
format:
	@echo "格式化 Python 代码..."
	cd backend && black app/ tests/
	@echo "格式化 TypeScript 代码..."
	cd frontend && npm run format

# Linting
lint:
	@echo "检查 Python 代码..."
	cd backend && flake8 app/ tests/
	@echo "检查 TypeScript 代码..."
	cd frontend && npm run lint

# 生成数据库迁移
migration:
	@echo "生成数据库迁移..."
	@set /p MESSAGE="迁移说明: "
	docker-compose exec backend alembic revision --autogenerate -m "%MESSAGE%"

# 备份数据库
backup:
	@echo "备份数据库..."
	docker-compose exec postgres pg_dump -U postgres cryptosage > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "备份完成！"

# 查看容器状态
ps:
	docker-compose ps

# 查看资源使用
stats:
	docker stats
