#!/bin/bash

# ==============================================================================
# AWS Academy Credentials
# Copy the values from AWS Details > Learner Lab, then source this file:
#   source 00-export_vars.sh
# ==============================================================================

export AWS_ACCESS_KEY_ID="ASIA4FSWNYDJ7QNBCLIS"
export AWS_SECRET_ACCESS_KEY="8bxk14vOtkFqnnNyTSS1zBOOWMu/SmkU/b8ebdIc"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjEPH//////////wEaCXVzLXdlc3QtMiJHMEUCIQCFEhJ/chSpt2zp636l/g6IkZxCzJjgsHsOr06Bx7fuogIgINr8KjoTrNm9vGevUNjd7uyrWyVaYH5GkBUnM+knevsqwAIIuv//////////ARABGgw4MzY2MjYxMzcyOTkiDCHCXiGIvyuL5f9MziqUAu4Xd5eEAZYaSZG6ae/sSpyQ8KRyTqZcbMIsJaFbGekGJC6WM7elIJ1HCbMmTEhHvMEX7M994np/LG3Xm8Le4BAvDW48rY3xib3C6/vx5b6CA9LaaqW/lInIHmnywjL7+I1PgH/dKP07pm9jGu5v7ZzvALSjmdmUTi5p0asIV3mcYcNPa0VUc3DZCNe1M7wZM6okF7JQzFjaf4puM+jjCmHORA1t3a2bwIAQd1oWnYPjGMfzZA15I8PLuEbmOfJPAV9rKQb6UCV0cNqRKJfMjkOO0JOeVR6IeW8Dqn+ioRd0R6CncIxYynrfqtRadOSBDOlCj1EzgjjYIAeNEoXP1AJFxh4tUDAvdBOfuzOMl0dtPVkg8zD5mozSBjqdASo18thVRQ362ufMoSUA4/bXmLnjIbYb29J/tztmx2pM14jgGtbDr1cJ9XCDrVk8EaO/ZyxnwjttbIw/l7pPrYhOU2+1UqxLntguvnzJAKHrnA8I0Hn4M9i37hGapLVRJwfbFx8HvQiiWjddcVl2mbB2M6UnTaFt9q1Ougs1xT9l8x+DBzPms6S6Z5aAMk1VrL7CL8ihmuaTI+eG1v0="

# Conectar al cluster:
#   aws eks update-kubeconfig --region us-east-1 --name innovatech-eks
#
# Autenticar Docker con ECR:
#   aws ecr get-login-password --region us-east-1 \
#     | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
