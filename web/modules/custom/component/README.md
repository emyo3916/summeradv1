# Component module

## Introduction

Adding JS components to your Drupal site just got a whole lot easier. Just
combine your JS components (any type) with a `*.component.yml` file and and put
it in a "components" subfolder in your module or theme. Now, your component will
be available in Drupal as a block - automatically!

You can also add a configuration form to your component so site builders can
modify the component. This component "looks" like any other block, so it can be
used just like a core block.

JS devs don't need to know PHP or Drupal in order to integrate their components
into the CMS. They just need to setup the `*.components.yml` file properly.

## Configuration
Just enable the module and you are good to go. There is a submodule of example
components available for testing and as reference.

## Component.yml
The `*.components.yml` file provides the JS developer with a ton of basic
configuration options. By modifying this file, you can provide static or
dynamic parameters, include additional libraries, and even adjust the cache
configuration. See the code comments on `example_tabs.component.yml`
for details.

    name: Widget
    machine_name: widget
    type: component
    core_version_requirement: ^8 || ^9 || ^10
    js:
      widget.js: {}
    css:
	    widget.css: {}
Thats it! Put the `widget.component.yml` file into a directory with the
widget.js and widget.css, and you now have a component. This can be placed
into the `components` subfolder in any module or theme to become available.

## How it works
We have an auto-discovery mechanism designed to find the `component.yml` file.
This is similar to what is able to find the modules, themes, and profiles in
the codebase. These components need to be placed in a "component" subfolder in
your module or theme. Optionally, you can also refer to external JS/CSS assets
(like from a CDN).

A component is a block plugin called `ComponentBlock`. That means it's just an
extension of the block entity in Drupal. So, we can interact with components
just like we do for normal blocks!

The `component.yml` file tells Drupal what this component is called, where the
assets are located, and how the block can be configured. The module creates a
library definition for each component, loads any other library dependencies,
and renders the default html to the page.

When the page loads, it has the html it needs (including custom HTML elements)
and then the JS is run in the browser like normal.

Each component is also available as a library in Drupal, so we can share code
by listing it as a dependency for other components. Using this approach, JS
developers can quickly and easily make their components available inside Drupal
without ever touching PHP or Twig.

In fact, you can actually define a component as type `library`, which will add
the library without creating a block instance. The best part is that this
enables us to take advantage of everything Drupal offers with regards to
dependency management and CSS/JS aggregation.

## ACF Reference
For a more robust and complete example of how you can use the `component`
module, see the ACF repo here: https://github.com/acquia/acf

This is a reference architecture for creating a hybrid integration with an
ecommerce platform. In this model, we use components to handle any integration
that is not cacheable - real time updates, current inventory, cart, whishlist,
checkout, etc. In ACF you will see how we use blocks, libraries, and a concept
of a lite `plugin` to manage a robust collection of useable components.

## Contributions
- Inspired by the PDB module (mrjmd/decoupled_blocks)
- Kevin Funk

### Backlog
- create some more examples - backbone, other core libraries
