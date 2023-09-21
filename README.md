# recets
simple distributed system based on stream from multiple crypto exchanges(in the future)

### services:
- sender(multiple): can come from multiple crypto exchange
- converter: used to parse raw data from sender and convert it to required model
- search: service to find price based on required amount
- save: save data to db from SearchResult
- compare: used to compare symbol from multiple exchanges to find profit by percentage
- mongo-sink: from search result to apache kafka to mongodb

# Tech
- Redis: to convert price based on your local currencies
- RabbitMQ: communicate between services (still finding best pratices)
- NodeJS (yeahhhhhhhhhhhhh bad yavascript for big data processing LOLL)
- ApacheKafka: send search result to apache kafka topics
- MongoSinkConnector: apache kafka to mongodb connector
- MongoDB: save kafka topic stream

### TODO:
- extract reusable types
- classified func for better state management (prevent bad garbage)
- compare service
- add test
