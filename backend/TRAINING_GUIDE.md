# 模型训练指南

## 训练 LSTM 价格预测模型

### 前提条件
确保已安装所有依赖：
```bash
cd backend
pip install -r requirements.txt
```

### 训练模型

#### 1. 训练 BTC 模型（默认配置）
```bash
python train_model.py
```

这将训练一个 BTCUSDT 1小时模型，使用：
- 90天历史数据
- 60个时间步序列长度
- 预测未来1小时价格

#### 2. 自定义训练参数
```bash
python train_model.py --symbol ETHUSDT --interval 1h --days 120 --sequence_length 100
```

参数说明：
- `--symbol`: 交易对（如 BTCUSDT, ETHUSDT, BNBUSDT）
- `--interval`: K线间隔（1m, 5m, 15m, 1h, 4h, 1d）
- `--days`: 历史数据天数（建议 60-180）
- `--sequence_length`: 输入序列长度（建议 60-120）
- `--prediction_horizon`: 预测步数（1=下一个时间步）

### 训练输出

训练完成后，将在 `models/` 目录下生成：
1. `{SYMBOL}_{INTERVAL}_final.pt` - 最终模型权重
2. `best_model.pt` - 验证集最佳模型
3. `{SYMBOL}_{INTERVAL}_metadata.json` - 模型元数据
4. `{SYMBOL}_{INTERVAL}_scaler.json` - 特征归一化参数

### 模型性能指标

训练过程会输出：
- **MAE** (Mean Absolute Error): 平均绝对误差（美元）
- **MAPE** (Mean Absolute Percentage Error): 平均绝对百分比误差
- **RMSE** (Root Mean Square Error): 均方根误差

### 示例：训练多个模型

```bash
# BTC 1小时预测
python train_model.py --symbol BTCUSDT --interval 1h --days 90

# ETH 1小时预测
python train_model.py --symbol ETHUSDT --interval 1h --days 90

# BNB 1小时预测
python train_model.py --symbol BNBUSDT --interval 1h --days 90

# SOL 1小时预测
python train_model.py --symbol SOLUSDT --interval 1h --days 90
```

### 使用预测 API

训练完成后，可通过 API 获取预测：

```bash
# GET 请求
curl http://localhost:8000/api/v1/prediction/BTC

# POST 请求
curl -X POST http://localhost:8000/api/v1/prediction/price \
  -H "Content-Type: application/json" \
  -d '{"symbol": "BTCUSDT", "interval": "1h", "horizons": [1, 4, 24]}'
```

### 注意事项

1. **首次训练**：数据收集可能需要几分钟
2. **GPU 加速**：如有 CUDA GPU，训练会自动使用
3. **内存需求**：建议至少 4GB RAM
4. **训练时间**：通常 5-15 分钟（取决于数据量和硬件）
5. **模型更新**：建议每周重新训练以适应市场变化

### 故障排查

**问题：数据收集失败**
- 检查网络连接
- 确认 Binance API 可访问

**问题：内存不足**
- 减少 `--days` 参数
- 减少 `batch_size`（修改 train_model.py）

**问题：训练很慢**
- 检查是否使用 GPU
- 减少 `epochs` 或 `sequence_length`
