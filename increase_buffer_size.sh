#!/bin/bash

sudo sysctl -w net.core.rmem_max=7500000
sudo sysctl -w net.core.wmem_max=7500000

echo "Increasing Buffer size work is done!"
