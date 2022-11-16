# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's adding a new pattern, providing implementation for existing pattern, or bug report we greatly value feedback and contributions from our community.

Please read through this document before submitting any pull requests to ensure we have all the necessary information to effectively respond to your bug report or contribution.


## Adding a new pattern

Each pattern in this catalog adheres to the following format:

* Name - an evocative name is important for the community to adopt the vocabulary. A builder should be able to say “I think we should extract this invocation into a destination”
* Diagram / Sketch - a visual that captures the essence of the pattern. It doesn’t have to be a class diagram or full-on architecture diagram. Recognizability is most important: can a developer see what the refactoring suggests just from the visual
* Description - one paragraph describing what the refactoring suggests, including the benefits
* Implementation - a longer description that explains how to do it
* Considerations - things to keep in mind when using this refactoring
* Related Refactorings - If someone uses this one, what other refactoring could logically follow?


## Implementing code for existing pattern

* Each contributor should implement and document one refactoring from Strawman Catalog. 
* The implementation of the 'before' and 'after' examples can be in Python or Typescript
* The 'after' example should use CDK
* The documentation is in markdown
* We aim to build running examples that include a test rig to show that the behavior before and after is identical.


## Reporting Bugs

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment



## Contribute via Pull Requests
Before sending us a pull request, please ensure that:

1. You are working against the latest source on the *main* branch.
2. You check existing open, and recently merged, pull requests to make sure someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you also reformat all the code, it will be hard for us to focus on your change.
3. Ensure local tests pass.
4. Commit to your fork using clear commit messages.
5. Send us a pull request, answering any default questions in the pull request interface.
6. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).



## Code of Conduct
This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.


## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public github issue.


## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.