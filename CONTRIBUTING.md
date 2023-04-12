# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's adding a new pattern, providing implementation for existing pattern, or bug report we greatly value feedback and contributions from our community.

Please reach out to Sindhu or Gregor with your intent **before** implementing a pattern. We would hate for your time to be wasted if someone else is already working on it.

Also read through this document before submitting any pull requests to ensure we have all the necessary information to effectively respond to your bug report or contribution.


## Adding a new pattern

Each pattern in this catalog adheres to the following format:

* Name - an evocative name is important for the community to adopt the vocabulary. A builder should be able to say “I think we should extract this invocation into a destination”
* Diagram / Sketch - a visual that captures the essence of the pattern. It doesn’t have to be a class diagram or full-on architecture diagram. Recognizability is most important: can a developer see what the refactoring suggests just from the visual
* Description - one paragraph describing what the refactoring suggests, including the benefits
* Implementation - a longer description that explains how to do it
* Considerations - things to keep in mind when using this refactoring
* Related Refactorings - If someone uses this one, what other refactoring could logically follow?


## Implementing code for existing pattern

* The implementation of the 'before' and 'after' examples can be in Typescript or Python.
* The 'after' example should use AWS CDK
* The README should include 1/before - after diagram 2/ steps on how to run the project 3/ how the behavior 'before' and 'after' is identical.
* From security compliance, you must add [cdk-nag](https://github.com/cdklabs/cdk-nag) and address all critical findings.


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
2. *For bugs:* Please check existing open, and recently merged pull requests to ensure someone else hasn't addressed the problem already.
3. *For implementing new patterns:* Please reach to owners of this repo and provide short description - we would hate for your time to be wasted.

To send us a pull request, please:

1. Fork the repository.
2. Modify the source; please focus on the specific change you are contributing. If you reformat all the code, it will be hard for us to focus on your change.
3. Run [cdk-nag](https://github.com/cdklabs/cdk-nag) and ensure all critical findings are addressed. Add reasoning when supressing a rule.
4. Commit to your fork using clear commit messages.
5. Send us a pull request and include the output of `cdk-nag`.
6. Pay attention to comments to your pull request, and stay involved in the conversation.

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
