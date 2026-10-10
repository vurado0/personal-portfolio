---
title: Machine learning essentials
category: machine-learning
tags: [machine-learning, python, neural-networks]
skills: [machine-learning, python]
summary: The models I trained in the ML course — decision trees, random forests, gradient boosting, a neural network on Fashion-MNIST, PCA and clustering — plus how to evaluate and explain them.
updated: 2026-06-20
difficulty: beginner
---

From *Machine Learning* (FH JOANNEUM, summer 2026). Python, scikit-learn and Jupyter notebooks, with the environment managed by `uv`.

## Workflow

1. Split the data **before** you look at it: train / validation / test. The test set is used once, at the end.
2. Start with a simple baseline, then improve.
3. Pick a metric that fits the problem: accuracy only works for balanced classes. Otherwise use precision, recall or F1.

## Models

- **Decision tree**: easy to read, but overfits. Limit `max_depth` and `min_samples_leaf`.
- **Random forest**: many trees on random subsets of rows and features, averaged. Robust and a good default.
- **Gradient boosting**: trees built one after another, each fixing the errors of the last. Often the strongest on tables, but needs tuning (learning rate, number of trees).
- **Neural network (Fashion-MNIST)**: dense layers with ReLU and a softmax output. Normalise the pixels and watch the validation loss to stop before it overfits.
- **PCA**: compresses features into a few components, which helps for plotting and speed.
- **k-means**: groups unlabeled data. Choose *k* with the elbow method or the silhouette score.

## Explainability

Feature importance, permutation importance and SHAP-style explanations show *why* a model decides something. That matters as soon as the model affects people.

For practice I generated my own dataset (Tokyo ramen shops 🍜) and trained models on it before the quiz.
