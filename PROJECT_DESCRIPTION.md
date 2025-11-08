Searcha is a Swedish webapp.

It is a job searching platform.

It gets jobs from platsbanken (arbetsförmedligen) and shows them with a nice interface and easy to search interface. It gets updates from platsbanken every hour so we always have fresh jobs.

It lets people sign up and be users.

As a user you can AI generate CV and personal letters.
This has to be easy. How to do this the best is TBD.

So that is basically it for the B2C side. You sign up, you can apply to jobs with applications thats are tailored to you and the job and the company in question that you are applying to. So the agent gets info from the company, the job and info from you to tailor it. How to do this exactly is also TBD. If one can do this while sleeping it would be awesome. We might be able to build an agent that goes and applies to jobs for people.

We grow this with programmatic SEO at first.

So there are two websites to build. One that is nice and made for SEO and server side rendering. The second is a client side app for users when they are logged in. These are separated in the monorepo. The client side one has a prefix - "app.searcha.se".

That is the B2C side.

For B2B which is later on in the process we want to let companies upload jobs on their own. We also want job matching. We want to show candidates that are a good match for companies immediately, for a fee of course. We can do this by making embeddings on job and people and doing vector search over them and then normalizing on the distance to get a %-based match. Details are TBD. We want this part for B2C also as we can show users how good of a match a job can be and you can search for personal relevance.

The B2C and B2B is the same app. So we need to think about having teams (a company account, or being a member of a company) and a user type kind of, if you are a b2b user or a b2c user. This can be quite easily done with Better Auth but details are TBD.

Making money.
For B2C we could take a small amount per month to get X job searches generated and for background searching jobs and so on.
For B2B we can take a small sum for each job listing, to get matches instantly and probably way more things, sponsored job listings if we get big. It feels like there are endless possibilities here.
