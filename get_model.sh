#!/bin/bash

url="https://raw.githubusercontent.com/infinitered/nsfwjs/master/example/nsfw_demo/public/model"

wget "${url}/model.json" -P dist/model

for i in {1..6}
do
	wget "${url}/group1-shard${i}of6" -P dist/model
done
