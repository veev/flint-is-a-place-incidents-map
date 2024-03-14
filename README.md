# Flint Is A Place Incidents Map

## Run Project

This project runs on Node.js **v10.0.0**

You can use an older version of Node.js with `nvm` (Node Version Manager). If you haven't installed nvm yet, you can do so by following the instructions on the [nvm GitHub page.](https://github.com/nvm-sh/nvm)

Once nvm is installed, run:

```
nvm install 10.0.0
nvm use 10.0.0
```

To check which version of Node.js you are using, run:

```
node -v
```

Yarn is optional

In the project root directory, install node modules and dependencies:

Run `yarn install` or `npm install`

To run the project locally:

Run `yarn start` or `npm start`

The application should be available in the following url:

http://localhost:3000

## Development

For local development you need to have Node.js **v7.10.1** or higher installed.

To deploy changes to the project on Github, merge any working branch into main

This will run a Github Action to deploy `main` to the `gh-pages` branch

A live preview of the code is visible here: [https://veev.github.io/flint-is-a-place-incidents-map/](https://veev.github.io/flint-is-a-place-incidents-map/)

## Background

For information on the origins and process of the project, you can read more [here](https://genevievehoffman.com/Flint-is-a-place)

## Data

This project uses a combination of various data sets to document a "day in the life" of the Flint police department. It combines audio recordings of the public dispatch radio frequency, with a data export of incidents from the Flint PD's incident queuing program.

Raw audio files are stored on Amazon AWS, while a smaller json file in the repo `(audio-smallerArray.json)` references their filenames and timestamps.

I created a geoJSON feature collection `(may10-11-incidents-timestamps-formatted-audio6-yPos-ids.json)` of the original data export of the police incidents data by using Google's geocoding API from the addresses shared with police dispatch.

An additional dataset of scraped Facebook comments `(featuresWithPosts-May5-12-sm2.json)` highlights the community's response to the incidents around them. A few volunteers take turns listening to the police dispatch audio and create Facebook posts for each one they hear. Then community members comment on the post, sharing tips, prayers, and other messages. After scraping the comments, I matched them to the geocoded features based on the timestamp and incident type.
