# TrueToSizeExample

## Introduction

The goal is to create a service to calculate new true-to-size data through HTTP and store this data in a Postgres. Additionally, this service should be able to return a shoe’s TrueToSizeCalculation, defined below, through an HTTP request. True to size entries range between 1 and 5, inclusive, where 1: really small, 2: small, 3: true to size, 4: big and 5: really big.

## System Requirements

1. Node.js - 10.15.2
2. Postgres
3. dbeaver (optional database editor)
4. Bash
5. Docker
6. Docker compose
7. Postman (optional)

## How to use

1. In the docker-compose file, set the `SETUPDB` to `1`
2. Run: `docker-compose run acceptance-test`
3. Fill in the product name `adidas Yeezy`
4. Fill in the true to size values: `1,2,2,3,2,3,2,2,3,4,2,5,2,3`
5. Receive the true to size calculation.
6. If you want to run it again, just make sure to change the `SETUPDB` to `0`

## API design

This gets all the product models that are in the database.  i.e. `adidas yeezy`
- stockx/v1/models/

This gets one product model based on it's id.
- stockx/v1/models/{id}

This is the stats for a given model.  So everything from size to whatever is important to crunch numbers.
- stockx/v1/models/{id}/stats

This gets the true to size value for a given product model.
- stockx/v1/models/{id}/TrueToSize

For more information about the API, check out the postman import script.  It is located under misc/postman.json

## Database design

Tables: model, stats

Model
1. Id
2. Name
3. Description
4. DateOfEntry
5. LastModified
6. Company
7. CreatedBy

TrueToSize
1. Id
2. ModelId
3. Size
4. DateOfEntry
5. LastModified
6. CreatedBy

## Sample output

![output](https://raw.githubusercontent.com/supermitsuba/TrueToSizeExample/master/misc/output.png)

## Considerations

1.  Docker images that are from docker hub should be "branched".  This means to pull down the image and then resubmit it to your own docker hub account.  This way if the author changes the version, the image you rely on isn't unexpectedly changed.

2. Couldn't run the table creation script at startup with the database creation.  Thought it was weird but didn't have enough time to diagnose the issue fully.  So there is an extra step for creating the tables.

3. To post the true to size, I put the values under stats.  This way, if there are more values that are stats about the shoe, we can expand this API without having to version it.

4.  I wanted to create a swagger page for the API documentation.  This would have expanded on the postman script by offering the return values as well as expected status codes.  The return values are simple enough that you can see that { "result": value } is the shell around a database record.  Also, the only status codes I used were 200, and 400 if the user inputed bad request.

5.  Testing was skipped due to the size of the project.  The exercise has some example of how the API works, and this to me would be an example of an acceptance test.  See the acceptance-test folder for the app that would exercise the code.

6.  I noticed that you probably want to know when and who entered data for auditing reasons.  Its not needed but I added it as something to help.

7.  Datetime gets wacky in containers.  One reason is that containers dont sync up to datetime servers by default.  Also, you would need to localize the datetime from the server to the client.  I havent done this.

8.  I could have built the images based on my local code, as opposed to git, but I was having issues finding what the disconnect was, so I opted to clone my repo instead.  The result is the same for this, but for work code, I would opt for the former option.

9.  Error messages could be improved.  While I do catch and transform them, the acceptance tests don't leverage them as well.  Also the postgres errors are a bit boring.