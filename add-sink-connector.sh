#!/bin/bash

curl --location 'http://192.168.1.2:8083/connectors' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "mongo-sink-connector",
  "config": {
    "connector.class": "com.mongodb.kafka.connect.MongoSinkConnector",
    "tasks.max": "1",
    "topics": "your-kafka-topic-name",
    "connection.uri": "mongodb://root:example_password@mongodb:27017",
    "database": "price-search-result",
    "collection": "orderbook",
    "key.converter": "org.apache.kafka.connect.storage.StringConverter",
    "key.converter.schemas.enable": "false",
    "value.converter": "org.apache.kafka.connect.json.JsonConverter",
    "value.converter.schemas.enable": "false",
    "value.projection.list": "coin,exchange,buyPrice,buyAmount,sellPrice,sellAmount,createdAt,updatedAt",
    "document.id.strategy": "com.mongodb.kafka.connect.sink.processor.id.strategy.PartialValueStrategy",
    "document.id.strategy.partial.value.projection.list": "coin,exchange",
    "document.id.strategy.partial.value.projection.type": "AllowList",
    "writemodel.strategy": "com.mongodb.kafka.connect.sink.writemodel.strategy.ReplaceOneBusinessKeyStrategy",
    "writemodel.strategy.businessKey": "coin,exchange"
  }
}
'
