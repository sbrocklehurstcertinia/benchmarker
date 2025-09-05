/** @ignore */
/*
 * Copyright (c) 2025 Certinia Inc. All rights reserved.
 */
import { Entity, Column } from 'typeorm';
import { PerformanceBaseEntity } from './base';
import { DEFAULT_STRING_VALUE } from '../../shared/constants';

@Entity({ name: 'ui_test_info' })
export class UiTestInfo extends PerformanceBaseEntity {
  [key: string]: number | string | Date | boolean | undefined;

  @Column('text', { nullable: true, name: 'action' })
  public action = DEFAULT_STRING_VALUE;

  @Column('text', { nullable: true, name: 'flow_name' })
  public flowName = DEFAULT_STRING_VALUE;

  @Column('text', { nullable: true, name: 'product' })
  public product = DEFAULT_STRING_VALUE;

  @Column('text', { nullable: true, name: 'additional_data' })
  public additionalData = DEFAULT_STRING_VALUE;

  public constructor() {
    super();
  }
}
