FROM public.ecr.aws/lambda/python:3.11

# Copy dependencies and app code
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY lambda_function.py ./

# Define the Lambda handler
CMD ["lambda_function.lambda_handler"]
