<?php

namespace Drupal\component;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\DependencyInjection\ServiceProviderBase;
use Symfony\Component\DependencyInjection\Reference;

class ComponentServiceProvider extends ServiceProviderBase {

  /**
   * {@inheritdoc}
   */
  public function alter(ContainerBuilder $container) {
    // @todo Delete this when dropping Drupal 8 support.
    if ($container->has('component.discovery') && version_compare(\Drupal::VERSION, '9.0', '<')) {
      // @see https://www.drupal.org/project/drupal/issues/3074585
      $container->getDefinition('component.discovery')
        ->setArgument(0, new Reference('app.root'));
    }
  }

}
