
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ai_generations": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"credits_used": number,"error_code": string | null,"error_message": string | null,"id": string,"input": NonNullable<Json>,"input_tokens": number | null,"latency_ms": number | null,"model": string | null,"output": Json | null,"output_tokens": number | null,"provider": string | null,"raw_response": Json | null,"status": string,"task": string,"user_id": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"credits_used"?: number,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"input"?: NonNullable<Json>,"input_tokens"?: number | null,"latency_ms"?: number | null,"model"?: string | null,"output"?: Json | null,"output_tokens"?: number | null,"provider"?: string | null,"raw_response"?: Json | null,"status"?: string,"task": string,"user_id"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"credits_used"?: number,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"input"?: NonNullable<Json>,"input_tokens"?: number | null,"latency_ms"?: number | null,"model"?: string | null,"output"?: Json | null,"output_tokens"?: number | null,"provider"?: string | null,"raw_response"?: Json | null,"status"?: string,"task"?: string,"user_id"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_generations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_generations_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"ai_models": {
                  Row: {
                    "capabilities": (string)[],"config": NonNullable<Json>,"context_window": number | null,"display_name": string,"id": string,"is_active": boolean,"model_key": string,"provider_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "capabilities"?: (string)[],"config"?: NonNullable<Json>,"context_window"?: number | null,"display_name": string,"id"?: string,"is_active"?: boolean,"model_key": string,"provider_id": string
                  }
                  Update: {
                    "capabilities"?: (string)[],"config"?: NonNullable<Json>,"context_window"?: number | null,"display_name"?: string,"id"?: string,"is_active"?: boolean,"model_key"?: string,"provider_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_models_provider_id_fkey"
      columns: ["provider_id"]
isOneToOne: false
      referencedRelation: "ai_providers"
      referencedColumns: ["id"]
    }
                  ]
                },"ai_providers": {
                  Row: {
                    "adapter": string,"api_key_env": string | null,"base_url": string | null,"config": NonNullable<Json>,"created_at": string,"id": string,"is_active": boolean,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "adapter": string,"api_key_env"?: string | null,"base_url"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name": string,"slug": string
                  }
                  Update: {
                    "adapter"?: string,"api_key_env"?: string | null,"base_url"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_active"?: boolean,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"ai_task_routes": {
                  Row: {
                    "credits_cost": number,"fallback_model_id": string | null,"id": string,"is_active": boolean,"max_output_tokens": number,"model_id": string,"task": string,"temperature": number,"tier": string
                  }
                  ComputedFields: never
                  Insert: {
                    "credits_cost"?: number,"fallback_model_id"?: string | null,"id"?: string,"is_active"?: boolean,"max_output_tokens"?: number,"model_id": string,"task": string,"temperature"?: number,"tier"?: string
                  }
                  Update: {
                    "credits_cost"?: number,"fallback_model_id"?: string | null,"id"?: string,"is_active"?: boolean,"max_output_tokens"?: number,"model_id"?: string,"task"?: string,"temperature"?: number,"tier"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ai_task_routes_fallback_model_id_fkey"
      columns: ["fallback_model_id"]
isOneToOne: false
      referencedRelation: "ai_models"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ai_task_routes_model_id_fkey"
      columns: ["model_id"]
isOneToOne: false
      referencedRelation: "ai_models"
      referencedColumns: ["id"]
    }
                  ]
                },"analytics_events": {
                  Row: {
                    "country": string | null,"device": string | null,"event_type": string,"id": number,"occurred_at": string,"path": string,"referrer_host": string | null,"visitor_hash": string,"website_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country"?: string | null,"device"?: string | null,"event_type"?: string,"id"?: never,"occurred_at"?: string,"path"?: string,"referrer_host"?: string | null,"visitor_hash": string,"website_id": string,"workspace_id": string
                  }
                  Update: {
                    "country"?: string | null,"device"?: string | null,"event_type"?: string,"id"?: never,"occurred_at"?: string,"path"?: string,"referrer_host"?: string | null,"visitor_hash"?: string,"website_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "analytics_events_website_id_fkey"
      columns: ["website_id"]
isOneToOne: false
      referencedRelation: "websites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "analytics_events_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_user_id": string | null,"created_at": string,"entity_id": string | null,"entity_type": string | null,"id": number,"metadata": NonNullable<Json>,"workspace_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_user_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never,"metadata"?: NonNullable<Json>,"workspace_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never,"metadata"?: NonNullable<Json>,"workspace_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_user_id_fkey"
      columns: ["actor_user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_logs_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"billing_events": {
                  Row: {
                    "created_at": string,"error": string | null,"event_id": string,"event_type": string,"id": number,"payload": NonNullable<Json>,"processed_at": string | null,"provider": string,"workspace_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"error"?: string | null,"event_id": string,"event_type": string,"id"?: never,"payload": NonNullable<Json>,"processed_at"?: string | null,"provider": string,"workspace_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"error"?: string | null,"event_id"?: string,"event_type"?: string,"id"?: never,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: string,"workspace_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "billing_events_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"domains": {
                  Row: {
                    "created_at": string,"domain": string,"id": string,"is_primary": boolean,"last_checked_at": string | null,"last_error": string | null,"ssl_status": string,"status": string,"type": string,"updated_at": string,"verification_token": string,"verified_at": string | null,"website_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"domain": string,"id"?: string,"is_primary"?: boolean,"last_checked_at"?: string | null,"last_error"?: string | null,"ssl_status"?: string,"status"?: string,"type"?: string,"updated_at"?: string,"verification_token"?: string,"verified_at"?: string | null,"website_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"domain"?: string,"id"?: string,"is_primary"?: boolean,"last_checked_at"?: string | null,"last_error"?: string | null,"ssl_status"?: string,"status"?: string,"type"?: string,"updated_at"?: string,"verification_token"?: string,"verified_at"?: string | null,"website_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "domains_website_id_workspace_id_fkey"
      columns: ["website_id","workspace_id"]
isOneToOne: false
      referencedRelation: "websites"
      referencedColumns: ["id","workspace_id"]
    }
                  ]
                },"favorites": {
                  Row: {
                    "created_at": string,"template_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"template_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"template_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"features": {
                  Row: {
                    "description": string | null,"is_active": boolean,"key": string,"kind": string,"name": string,"sort_order": number,"unit": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"is_active"?: boolean,"key": string,"kind": string,"name": string,"sort_order"?: number,"unit"?: string | null
                  }
                  Update: {
                    "description"?: string | null,"is_active"?: boolean,"key"?: string,"kind"?: string,"name"?: string,"sort_order"?: number,"unit"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"import_sources": {
                  Row: {
                    "accepted_mime_types": (string)[],"guidance": string | null,"input_kind": string,"is_enabled": boolean,"key": string,"name": string,"sort_order": number,"url_pattern": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_mime_types"?: (string)[],"guidance"?: string | null,"input_kind": string,"is_enabled"?: boolean,"key": string,"name": string,"sort_order"?: number,"url_pattern"?: string | null
                  }
                  Update: {
                    "accepted_mime_types"?: (string)[],"guidance"?: string | null,"input_kind"?: string,"is_enabled"?: boolean,"key"?: string,"name"?: string,"sort_order"?: number,"url_pattern"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"imports": {
                  Row: {
                    "applied_summary": Json | null,"created_at": string,"created_by": string | null,"error_code": string | null,"error_message": string | null,"extracted_text": string | null,"id": string,"profile_id": string | null,"raw_metadata": NonNullable<Json>,"source_key": string,"source_url": string | null,"status": string,"storage_path": string | null,"structured": Json | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_summary"?: Json | null,"created_at"?: string,"created_by"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"extracted_text"?: string | null,"id"?: string,"profile_id"?: string | null,"raw_metadata"?: NonNullable<Json>,"source_key": string,"source_url"?: string | null,"status"?: string,"storage_path"?: string | null,"structured"?: Json | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "applied_summary"?: Json | null,"created_at"?: string,"created_by"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"extracted_text"?: string | null,"id"?: string,"profile_id"?: string | null,"raw_metadata"?: NonNullable<Json>,"source_key"?: string,"source_url"?: string | null,"status"?: string,"storage_path"?: string | null,"structured"?: Json | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "imports_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "imports_profile_id_workspace_id_fkey"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "imports_source_key_fkey"
      columns: ["source_key"]
isOneToOne: false
      referencedRelation: "import_sources"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "imports_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"media_assets": {
                  Row: {
                    "alt_text": string | null,"bucket": string,"created_at": string,"deleted_at": string | null,"height": number | null,"id": string,"mime_type": string,"original_name": string | null,"path": string,"public_url": string | null,"purpose": string,"size_bytes": number,"uploaded_by": string | null,"width": number | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt_text"?: string | null,"bucket": string,"created_at"?: string,"deleted_at"?: string | null,"height"?: number | null,"id"?: string,"mime_type": string,"original_name"?: string | null,"path": string,"public_url"?: string | null,"purpose"?: string,"size_bytes": number,"uploaded_by"?: string | null,"width"?: number | null,"workspace_id": string
                  }
                  Update: {
                    "alt_text"?: string | null,"bucket"?: string,"created_at"?: string,"deleted_at"?: string | null,"height"?: number | null,"id"?: string,"mime_type"?: string,"original_name"?: string | null,"path"?: string,"public_url"?: string | null,"purpose"?: string,"size_bytes"?: number,"uploaded_by"?: string | null,"width"?: number | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_assets_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "media_assets_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "action_url": string | null,"body": string | null,"created_at": string,"id": string,"read_at": string | null,"title": string,"type": string,"user_id": string,"workspace_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action_url"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"read_at"?: string | null,"title": string,"type": string,"user_id": string,"workspace_id"?: string | null
                  }
                  Update: {
                    "action_url"?: string | null,"body"?: string | null,"created_at"?: string,"id"?: string,"read_at"?: string | null,"title"?: string,"type"?: string,"user_id"?: string,"workspace_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notifications_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"owner_user_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"owner_user_id": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"owner_user_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "organizations_owner_user_id_fkey"
      columns: ["owner_user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_features": {
                  Row: {
                    "enabled": boolean,"feature_key": string,"limit_value": number | null,"plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "enabled"?: boolean,"feature_key": string,"limit_value"?: number | null,"plan_id": string
                  }
                  Update: {
                    "enabled"?: boolean,"feature_key"?: string,"limit_value"?: number | null,"plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_features_feature_key_fkey"
      columns: ["feature_key"]
isOneToOne: false
      referencedRelation: "features"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "plan_features_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "subscription_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"platform_settings": {
                  Row: {
                    "description": string | null,"is_public": boolean,"key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"is_public"?: boolean,"key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"is_public"?: boolean,"key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"profession_categories": {
                  Row: {
                    "created_at": string,"description": string | null,"icon": string | null,"id": string,"is_active": boolean,"name": string,"name_i18n": NonNullable<Json>,"slug": string,"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"name_i18n"?: NonNullable<Json>,"slug": string,"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"name_i18n"?: NonNullable<Json>,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"professions": {
                  Row: {
                    "category_id": string,"created_at": string,"description": string | null,"icon": string | null,"id": string,"is_active": boolean,"name": string,"name_i18n": NonNullable<Json>,"profile_fields": NonNullable<Json>,"recommended_sections": (string)[],"schema_org_type": string,"slug": string,"sort_order": number,"synonyms": (string)[],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"created_at"?: string,"description"?: string | null,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"name_i18n"?: NonNullable<Json>,"profile_fields"?: NonNullable<Json>,"recommended_sections"?: (string)[],"schema_org_type"?: string,"slug": string,"sort_order"?: number,"synonyms"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: string,"created_at"?: string,"description"?: string | null,"icon"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"name_i18n"?: NonNullable<Json>,"profile_fields"?: NonNullable<Json>,"recommended_sections"?: (string)[],"schema_org_type"?: string,"slug"?: string,"sort_order"?: number,"synonyms"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "professions_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "profession_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_achievements": {
                  Row: {
                    "achieved_on": string | null,"created_at": string,"description": string | null,"id": string,"is_visible": boolean,"metric": string | null,"profile_id": string,"sort_order": number,"title": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "achieved_on"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_visible"?: boolean,"metric"?: string | null,"profile_id": string,"sort_order"?: number,"title": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "achieved_on"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_visible"?: boolean,"metric"?: string | null,"profile_id"?: string,"sort_order"?: number,"title"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_achievements_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_achievements_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_awards": {
                  Row: {
                    "awarded_on": string | null,"created_at": string,"description": string | null,"id": string,"is_visible": boolean,"issuer": string | null,"profile_id": string,"sort_order": number,"title": string,"updated_at": string,"url": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "awarded_on"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_visible"?: boolean,"issuer"?: string | null,"profile_id": string,"sort_order"?: number,"title": string,"updated_at"?: string,"url"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "awarded_on"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_visible"?: boolean,"issuer"?: string | null,"profile_id"?: string,"sort_order"?: number,"title"?: string,"updated_at"?: string,"url"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_awards_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_awards_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_certifications": {
                  Row: {
                    "created_at": string,"credential_id": string | null,"credential_url": string | null,"expires_on": string | null,"id": string,"is_visible": boolean,"issued_on": string | null,"issuer": string | null,"name": string,"profile_id": string,"sort_order": number,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"credential_id"?: string | null,"credential_url"?: string | null,"expires_on"?: string | null,"id"?: string,"is_visible"?: boolean,"issued_on"?: string | null,"issuer"?: string | null,"name": string,"profile_id": string,"sort_order"?: number,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"credential_id"?: string | null,"credential_url"?: string | null,"expires_on"?: string | null,"id"?: string,"is_visible"?: boolean,"issued_on"?: string | null,"issuer"?: string | null,"name"?: string,"profile_id"?: string,"sort_order"?: number,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_certifications_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_certifications_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_education": {
                  Row: {
                    "created_at": string,"degree": string | null,"description": string | null,"end_date": string | null,"field_of_study": string | null,"grade": string | null,"id": string,"institution": string,"is_visible": boolean,"profile_id": string,"sort_order": number,"start_date": string | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"degree"?: string | null,"description"?: string | null,"end_date"?: string | null,"field_of_study"?: string | null,"grade"?: string | null,"id"?: string,"institution": string,"is_visible"?: boolean,"profile_id": string,"sort_order"?: number,"start_date"?: string | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"degree"?: string | null,"description"?: string | null,"end_date"?: string | null,"field_of_study"?: string | null,"grade"?: string | null,"id"?: string,"institution"?: string,"is_visible"?: boolean,"profile_id"?: string,"sort_order"?: number,"start_date"?: string | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_education_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_education_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_experiences": {
                  Row: {
                    "created_at": string,"description": string | null,"employment_type": string | null,"end_date": string | null,"highlights": (string)[],"id": string,"is_current": boolean,"is_visible": boolean,"location": string | null,"organization": string,"profile_id": string,"sort_order": number,"start_date": string | null,"title": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"employment_type"?: string | null,"end_date"?: string | null,"highlights"?: (string)[],"id"?: string,"is_current"?: boolean,"is_visible"?: boolean,"location"?: string | null,"organization": string,"profile_id": string,"sort_order"?: number,"start_date"?: string | null,"title": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"employment_type"?: string | null,"end_date"?: string | null,"highlights"?: (string)[],"id"?: string,"is_current"?: boolean,"is_visible"?: boolean,"location"?: string | null,"organization"?: string,"profile_id"?: string,"sort_order"?: number,"start_date"?: string | null,"title"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_experiences_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_experiences_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_locations": {
                  Row: {
                    "address_line": string | null,"city": string | null,"country_code": string | null,"created_at": string,"hours": string | null,"id": string,"is_primary": boolean,"is_service_area": boolean,"is_visible": boolean,"label": string,"map_url": string | null,"phone": string | null,"postal_code": string | null,"profile_id": string,"region": string | null,"sort_order": number,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line"?: string | null,"city"?: string | null,"country_code"?: string | null,"created_at"?: string,"hours"?: string | null,"id"?: string,"is_primary"?: boolean,"is_service_area"?: boolean,"is_visible"?: boolean,"label": string,"map_url"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"profile_id": string,"region"?: string | null,"sort_order"?: number,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "address_line"?: string | null,"city"?: string | null,"country_code"?: string | null,"created_at"?: string,"hours"?: string | null,"id"?: string,"is_primary"?: boolean,"is_service_area"?: boolean,"is_visible"?: boolean,"label"?: string,"map_url"?: string | null,"phone"?: string | null,"postal_code"?: string | null,"profile_id"?: string,"region"?: string | null,"sort_order"?: number,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_locations_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_locations_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_media_items": {
                  Row: {
                    "caption": string | null,"created_at": string,"external_url": string | null,"id": string,"is_visible": boolean,"kind": string,"media_asset_id": string | null,"profile_id": string,"sort_order": number,"title": string | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"external_url"?: string | null,"id"?: string,"is_visible"?: boolean,"kind": string,"media_asset_id"?: string | null,"profile_id": string,"sort_order"?: number,"title"?: string | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"external_url"?: string | null,"id"?: string,"is_visible"?: boolean,"kind"?: string,"media_asset_id"?: string | null,"profile_id"?: string,"sort_order"?: number,"title"?: string | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_media_items_asset_fk"
      columns: ["media_asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_media_items_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_media_items_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_projects": {
                  Row: {
                    "created_at": string,"description": string | null,"end_date": string | null,"id": string,"image_url": string | null,"is_featured": boolean,"is_visible": boolean,"profile_id": string,"role": string | null,"sort_order": number,"start_date": string | null,"tags": (string)[],"title": string,"updated_at": string,"url": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"image_url"?: string | null,"is_featured"?: boolean,"is_visible"?: boolean,"profile_id": string,"role"?: string | null,"sort_order"?: number,"start_date"?: string | null,"tags"?: (string)[],"title": string,"updated_at"?: string,"url"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"end_date"?: string | null,"id"?: string,"image_url"?: string | null,"is_featured"?: boolean,"is_visible"?: boolean,"profile_id"?: string,"role"?: string | null,"sort_order"?: number,"start_date"?: string | null,"tags"?: (string)[],"title"?: string,"updated_at"?: string,"url"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_projects_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_projects_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_publications": {
                  Row: {
                    "abstract": string | null,"authors": string | null,"created_at": string,"doi": string | null,"id": string,"is_visible": boolean,"profile_id": string,"pub_type": string,"published_on": string | null,"sort_order": number,"title": string,"updated_at": string,"url": string | null,"venue": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "abstract"?: string | null,"authors"?: string | null,"created_at"?: string,"doi"?: string | null,"id"?: string,"is_visible"?: boolean,"profile_id": string,"pub_type"?: string,"published_on"?: string | null,"sort_order"?: number,"title": string,"updated_at"?: string,"url"?: string | null,"venue"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "abstract"?: string | null,"authors"?: string | null,"created_at"?: string,"doi"?: string | null,"id"?: string,"is_visible"?: boolean,"profile_id"?: string,"pub_type"?: string,"published_on"?: string | null,"sort_order"?: number,"title"?: string,"updated_at"?: string,"url"?: string | null,"venue"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_publications_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_publications_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_services": {
                  Row: {
                    "created_at": string,"cta_label": string | null,"cta_url": string | null,"description": string | null,"duration_text": string | null,"icon": string | null,"id": string,"is_visible": boolean,"price_text": string | null,"profile_id": string,"sort_order": number,"title": string,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"cta_label"?: string | null,"cta_url"?: string | null,"description"?: string | null,"duration_text"?: string | null,"icon"?: string | null,"id"?: string,"is_visible"?: boolean,"price_text"?: string | null,"profile_id": string,"sort_order"?: number,"title": string,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"cta_label"?: string | null,"cta_url"?: string | null,"description"?: string | null,"duration_text"?: string | null,"icon"?: string | null,"id"?: string,"is_visible"?: boolean,"price_text"?: string | null,"profile_id"?: string,"sort_order"?: number,"title"?: string,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_services_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_services_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_skills": {
                  Row: {
                    "category": string | null,"created_at": string,"id": string,"is_visible": boolean,"level": number | null,"name": string,"profile_id": string,"sort_order": number,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string | null,"created_at"?: string,"id"?: string,"is_visible"?: boolean,"level"?: number | null,"name": string,"profile_id": string,"sort_order"?: number,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "category"?: string | null,"created_at"?: string,"id"?: string,"is_visible"?: boolean,"level"?: number | null,"name"?: string,"profile_id"?: string,"sort_order"?: number,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_skills_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_skills_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_social_links": {
                  Row: {
                    "created_at": string,"id": string,"is_visible": boolean,"label": string | null,"platform": string,"profile_id": string,"sort_order": number,"updated_at": string,"url": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_visible"?: boolean,"label"?: string | null,"platform": string,"profile_id": string,"sort_order"?: number,"updated_at"?: string,"url": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_visible"?: boolean,"label"?: string | null,"platform"?: string,"profile_id"?: string,"sort_order"?: number,"updated_at"?: string,"url"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_social_links_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_social_links_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_testimonials": {
                  Row: {
                    "author_name": string,"author_org": string | null,"author_title": string | null,"avatar_url": string | null,"created_at": string,"id": string,"is_visible": boolean,"profile_id": string,"quote": string,"rating": number | null,"sort_order": number,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"author_org"?: string | null,"author_title"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"id"?: string,"is_visible"?: boolean,"profile_id": string,"quote": string,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "author_name"?: string,"author_org"?: string | null,"author_title"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"id"?: string,"is_visible"?: boolean,"profile_id"?: string,"quote"?: string,"rating"?: number | null,"sort_order"?: number,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_testimonials_profile_fk"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "profile_testimonials_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "availability": string | null,"avatar_url": string | null,"bio_long": string | null,"bio_short": string | null,"city": string | null,"country_code": string | null,"cover_url": string | null,"created_at": string,"deleted_at": string | null,"display_name": string | null,"email_public": string | null,"extra": NonNullable<Json>,"full_name": string,"headline": string | null,"id": string,"languages": (string)[],"phone_public": string | null,"profession_id": string | null,"pronouns": string | null,"region": string | null,"tagline": string | null,"updated_at": string,"website_url": string | null,"whatsapp_number": string | null,"workspace_id": string,"years_experience": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "availability"?: string | null,"avatar_url"?: string | null,"bio_long"?: string | null,"bio_short"?: string | null,"city"?: string | null,"country_code"?: string | null,"cover_url"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"display_name"?: string | null,"email_public"?: string | null,"extra"?: NonNullable<Json>,"full_name": string,"headline"?: string | null,"id"?: string,"languages"?: (string)[],"phone_public"?: string | null,"profession_id"?: string | null,"pronouns"?: string | null,"region"?: string | null,"tagline"?: string | null,"updated_at"?: string,"website_url"?: string | null,"whatsapp_number"?: string | null,"workspace_id": string,"years_experience"?: number | null
                  }
                  Update: {
                    "availability"?: string | null,"avatar_url"?: string | null,"bio_long"?: string | null,"bio_short"?: string | null,"city"?: string | null,"country_code"?: string | null,"cover_url"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"display_name"?: string | null,"email_public"?: string | null,"extra"?: NonNullable<Json>,"full_name"?: string,"headline"?: string | null,"id"?: string,"languages"?: (string)[],"phone_public"?: string | null,"profession_id"?: string | null,"pronouns"?: string | null,"region"?: string | null,"tagline"?: string | null,"updated_at"?: string,"website_url"?: string | null,"whatsapp_number"?: string | null,"workspace_id"?: string,"years_experience"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "professions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"reserved_slugs": {
                  Row: {
                    "created_at": string,"reason": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"reason"?: string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"reason"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"section_types": {
                  Row: {
                    "category": string,"data_source": string | null,"default_content": NonNullable<Json>,"description": string | null,"icon": string | null,"is_active": boolean,"is_advanced": boolean,"is_singleton": boolean,"key": string,"name": string,"name_i18n": NonNullable<Json>,"sort_order": number,"variants": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"data_source"?: string | null,"default_content"?: NonNullable<Json>,"description"?: string | null,"icon"?: string | null,"is_active"?: boolean,"is_advanced"?: boolean,"is_singleton"?: boolean,"key": string,"name": string,"name_i18n"?: NonNullable<Json>,"sort_order"?: number,"variants"?: (string)[]
                  }
                  Update: {
                    "category"?: string,"data_source"?: string | null,"default_content"?: NonNullable<Json>,"description"?: string | null,"icon"?: string | null,"is_active"?: boolean,"is_advanced"?: boolean,"is_singleton"?: boolean,"key"?: string,"name"?: string,"name_i18n"?: NonNullable<Json>,"sort_order"?: number,"variants"?: (string)[]
                  }
                  Relationships: [
                    
                  ]
                },"subscription_plans": {
                  Row: {
                    "billing_interval": string,"created_at": string,"currency": string,"description": string | null,"highlights": (string)[],"id": string,"is_default": boolean,"is_featured": boolean,"name": string,"price_minor": number,"provider_plan_ids": NonNullable<Json>,"slug": string,"sort_order": number,"status": string,"trial_days": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_interval"?: string,"created_at"?: string,"currency"?: string,"description"?: string | null,"highlights"?: (string)[],"id"?: string,"is_default"?: boolean,"is_featured"?: boolean,"name": string,"price_minor"?: number,"provider_plan_ids"?: NonNullable<Json>,"slug": string,"sort_order"?: number,"status"?: string,"trial_days"?: number,"updated_at"?: string
                  }
                  Update: {
                    "billing_interval"?: string,"created_at"?: string,"currency"?: string,"description"?: string | null,"highlights"?: (string)[],"id"?: string,"is_default"?: boolean,"is_featured"?: boolean,"name"?: string,"price_minor"?: number,"provider_plan_ids"?: NonNullable<Json>,"slug"?: string,"sort_order"?: number,"status"?: string,"trial_days"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"subscriptions": {
                  Row: {
                    "cancel_at_period_end": boolean,"cancelled_at": string | null,"created_at": string,"current_period_end": string | null,"current_period_start": string,"id": string,"plan_id": string,"provider": string,"provider_customer_id": string | null,"provider_subscription_id": string | null,"status": string,"trial_ends_at": string | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_at_period_end"?: boolean,"cancelled_at"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_period_start"?: string,"id"?: string,"plan_id": string,"provider"?: string,"provider_customer_id"?: string | null,"provider_subscription_id"?: string | null,"status": string,"trial_ends_at"?: string | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "cancel_at_period_end"?: boolean,"cancelled_at"?: string | null,"created_at"?: string,"current_period_end"?: string | null,"current_period_start"?: string,"id"?: string,"plan_id"?: string,"provider"?: string,"provider_customer_id"?: string | null,"provider_subscription_id"?: string | null,"status"?: string,"trial_ends_at"?: string | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "subscriptions_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "subscription_plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "subscriptions_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"template_categories": {
                  Row: {
                    "category_id": string,"template_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": string,"template_id": string
                  }
                  Update: {
                    "category_id"?: string,"template_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "template_categories_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "profession_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "template_categories_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    }
                  ]
                },"template_professions": {
                  Row: {
                    "is_recommended": boolean,"profession_id": string,"template_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "is_recommended"?: boolean,"profession_id": string,"template_id": string
                  }
                  Update: {
                    "is_recommended"?: boolean,"profession_id"?: string,"template_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "template_professions_profession_id_fkey"
      columns: ["profession_id"]
isOneToOne: false
      referencedRelation: "professions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "template_professions_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    }
                  ]
                },"template_reviews": {
                  Row: {
                    "comment": string | null,"created_at": string,"id": string,"rating": number,"template_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"rating": number,"template_id": string,"user_id": string
                  }
                  Update: {
                    "comment"?: string | null,"created_at"?: string,"id"?: string,"rating"?: number,"template_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "template_reviews_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "template_reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"template_versions": {
                  Row: {
                    "changelog": string | null,"config": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"published_at": string | null,"status": string,"template_id": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "changelog"?: string | null,"config": NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"published_at"?: string | null,"status"?: string,"template_id": string,"version": number
                  }
                  Update: {
                    "changelog"?: string | null,"config"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"published_at"?: string | null,"status"?: string,"template_id"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "template_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "template_versions_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    }
                  ]
                },"templates": {
                  Row: {
                    "author": string,"color_family": string | null,"created_at": string,"current_version_id": string | null,"demo_profile_key": string | null,"description": string | null,"features": (string)[],"id": string,"is_featured": boolean,"layout": string,"name": string,"preview_image_url": string | null,"published_at": string | null,"slug": string,"status": string,"style": string,"tags": (string)[],"thumbnail_url": string | null,"tier": string,"updated_at": string,"use_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "author"?: string,"color_family"?: string | null,"created_at"?: string,"current_version_id"?: string | null,"demo_profile_key"?: string | null,"description"?: string | null,"features"?: (string)[],"id"?: string,"is_featured"?: boolean,"layout": string,"name": string,"preview_image_url"?: string | null,"published_at"?: string | null,"slug": string,"status"?: string,"style": string,"tags"?: (string)[],"thumbnail_url"?: string | null,"tier"?: string,"updated_at"?: string,"use_count"?: number
                  }
                  Update: {
                    "author"?: string,"color_family"?: string | null,"created_at"?: string,"current_version_id"?: string | null,"demo_profile_key"?: string | null,"description"?: string | null,"features"?: (string)[],"id"?: string,"is_featured"?: boolean,"layout"?: string,"name"?: string,"preview_image_url"?: string | null,"published_at"?: string | null,"slug"?: string,"status"?: string,"style"?: string,"tags"?: (string)[],"thumbnail_url"?: string | null,"tier"?: string,"updated_at"?: string,"use_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "templates_current_version_fk"
      columns: ["current_version_id","id"]
isOneToOne: false
      referencedRelation: "template_versions"
      referencedColumns: ["id","template_id"]
    }
                  ]
                },"usage_records": {
                  Row: {
                    "id": number,"metric": string,"occurred_at": string,"quantity": number,"ref_id": string | null,"ref_type": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"metric": string,"occurred_at"?: string,"quantity": number,"ref_id"?: string | null,"ref_type"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "id"?: never,"metric"?: string,"occurred_at"?: string,"quantity"?: number,"ref_id"?: string | null,"ref_type"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "usage_records_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"email": string,"full_name": string | null,"id": string,"is_platform_admin": boolean,"locale": string,"onboarding_completed_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"email": string,"full_name"?: string | null,"id": string,"is_platform_admin"?: boolean,"locale"?: string,"onboarding_completed_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string,"is_platform_admin"?: boolean,"locale"?: string,"onboarding_completed_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"website_analytics_daily": {
                  Row: {
                    "day": string,"unique_visitors": number,"views": number,"website_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day": string,"unique_visitors"?: number,"views"?: number,"website_id": string,"workspace_id": string
                  }
                  Update: {
                    "day"?: string,"unique_visitors"?: number,"views"?: number,"website_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "website_analytics_daily_website_id_fkey"
      columns: ["website_id"]
isOneToOne: false
      referencedRelation: "websites"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "website_analytics_daily_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"website_sections": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"id": string,"is_enabled": boolean,"position": number,"section_type": string,"settings": NonNullable<Json>,"updated_at": string,"variant": string,"website_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_enabled"?: boolean,"position"?: number,"section_type": string,"settings"?: NonNullable<Json>,"updated_at"?: string,"variant"?: string,"website_id": string,"workspace_id": string
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"id"?: string,"is_enabled"?: boolean,"position"?: number,"section_type"?: string,"settings"?: NonNullable<Json>,"updated_at"?: string,"variant"?: string,"website_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "website_sections_section_type_fkey"
      columns: ["section_type"]
isOneToOne: false
      referencedRelation: "section_types"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "website_sections_website_id_workspace_id_fkey"
      columns: ["website_id","workspace_id"]
isOneToOne: false
      referencedRelation: "websites"
      referencedColumns: ["id","workspace_id"]
    }
                  ]
                },"website_versions": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"kind": string,"note": string | null,"snapshot": NonNullable<Json>,"version_number": number,"website_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"kind"?: string,"note"?: string | null,"snapshot": NonNullable<Json>,"version_number": number,"website_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"kind"?: string,"note"?: string | null,"snapshot"?: NonNullable<Json>,"version_number"?: number,"website_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "website_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "website_versions_website_id_workspace_id_fkey"
      columns: ["website_id","workspace_id"]
isOneToOne: false
      referencedRelation: "websites"
      referencedColumns: ["id","workspace_id"]
    }
                  ]
                },"websites": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"id": string,"locale": string,"name": string,"profile_id": string,"published_at": string | null,"published_version_id": string | null,"seo": NonNullable<Json>,"settings": NonNullable<Json>,"slug": string,"slug_changed_at": string | null,"status": string,"template_id": string,"template_version_id": string,"theme": NonNullable<Json>,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"locale"?: string,"name": string,"profile_id": string,"published_at"?: string | null,"published_version_id"?: string | null,"seo"?: NonNullable<Json>,"settings"?: NonNullable<Json>,"slug": string,"slug_changed_at"?: string | null,"status"?: string,"template_id": string,"template_version_id": string,"theme"?: NonNullable<Json>,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"id"?: string,"locale"?: string,"name"?: string,"profile_id"?: string,"published_at"?: string | null,"published_version_id"?: string | null,"seo"?: NonNullable<Json>,"settings"?: NonNullable<Json>,"slug"?: string,"slug_changed_at"?: string | null,"status"?: string,"template_id"?: string,"template_version_id"?: string,"theme"?: NonNullable<Json>,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "websites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "websites_profile_id_workspace_id_fkey"
      columns: ["profile_id","workspace_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "websites_published_version_fk"
      columns: ["published_version_id"]
isOneToOne: false
      referencedRelation: "website_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "websites_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "websites_template_version_id_template_id_fkey"
      columns: ["template_version_id","template_id"]
isOneToOne: false
      referencedRelation: "template_versions"
      referencedColumns: ["id","template_id"]
    },{
      foreignKeyName: "websites_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspace_members": {
                  Row: {
                    "created_at": string,"role": string,"user_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role": string,"user_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: string,"user_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspace_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workspace_members_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspaces": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"id": string,"kind": string,"name": string,"organization_id": string | null,"owner_user_id": string,"settings": NonNullable<Json>,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"kind"?: string,"name": string,"organization_id"?: string | null,"owner_user_id": string,"settings"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"id"?: string,"kind"?: string,"name"?: string,"organization_id"?: string | null,"owner_user_id"?: string,"settings"?: NonNullable<Json>,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspaces_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workspaces_owner_user_id_fkey"
      columns: ["owner_user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_custom_domain":
{ Args: { "p_domain": string,"p_platform_domain": string,"p_website": string }; Returns: {
              "created_at": string,
"domain": string,
"id": string,
"is_primary": boolean,
"last_checked_at": string | null,
"last_error": string | null,
"ssl_status": string,
"status": string,
"type": string,
"updated_at": string,
"verification_token": string,
"verified_at": string | null,
"website_id": string,
"workspace_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "domains"
        isOneToOne: true
        isSetofReturn: false
      } },
"admin_publish_template_version":
{ Args: { "p_version_id": string }; Returns: undefined
                           },
"ai_release_stale_reservations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"ai_reserve":
{ Args: { "p_input": Json,"p_task": string,"p_user": string,"p_workspace": string }; Returns: Json
                           },
"ai_settle":
{ Args: { "p_error_code"?: string,"p_error_message"?: string,"p_generation": string,"p_input_tokens": number,"p_latency_ms": number,"p_model": string,"p_output": Json,"p_output_tokens": number,"p_provider": string,"p_raw": Json,"p_status": string }; Returns: undefined
                           },
"apply_template":
{ Args: { "p_reset_theme"?: boolean,"p_template_slug": string,"p_website": string }; Returns: undefined
                           },
"billing_mark_event_processed":
{ Args: { "p_error"?: string,"p_event_id": string,"p_provider": string }; Returns: undefined
                           },
"billing_record_event":
{ Args: { "p_event_id": string,"p_event_type": string,"p_payload": Json,"p_provider": string,"p_workspace": string }; Returns: boolean
                           },
"billing_set_plan":
{ Args: { "p_period_end"?: string,"p_plan_slug": string,"p_provider": string,"p_provider_subscription_id"?: string,"p_status": string,"p_workspace": string }; Returns: string
                           },
"billing_update_subscription":
{ Args: { "p_cancel_at_period_end"?: boolean,"p_period_end"?: string,"p_provider": string,"p_provider_subscription_id": string,"p_status": string }; Returns: string
                           },
"change_website_slug":
{ Args: { "p_slug": string,"p_website": string }; Returns: undefined
                           },
"check_slug_availability":
{ Args: { "p_slug": string }; Returns: Json
                           },
"create_checkpoint":
{ Args: { "p_note"?: string,"p_website": string }; Returns: number
                           },
"create_website":
{ Args: { "p_name": string,"p_profile": string,"p_slug": string,"p_template_slug": string }; Returns: string
                           },
"delete_website":
{ Args: { "p_website": string }; Returns: undefined
                           },
"get_ai_usage":
{ Args: { "p_workspace": string }; Returns: Json
                           },
"get_entitlements":
{ Args: { "p_workspace": string }; Returns: Json
                           },
"get_profile_completion":
{ Args: { "p_profile": string }; Returns: Json
                           },
"get_published_site":
{ Args: { "p_slug": string }; Returns: Json
                           },
"get_published_site_by_domain":
{ Args: { "p_domain": string }; Returns: Json
                           },
"get_site_analytics":
{ Args: { "p_days"?: number,"p_website": string }; Returns: Json
                           },
"get_site_preview":
{ Args: { "p_website": string }; Returns: Json
                           },
"get_template_config":
{ Args: { "p_template_slug": string }; Returns: Json
                           },
"get_workspace_usage":
{ Args: { "p_workspace": string }; Returns: Json
                           },
"list_published_sites":
{ Args: { "p_after"?: string,"p_limit"?: number }; Returns: {
              "custom_domain": string,"published_at": string,"slug": string
            }[]
                           },
"list_showcase_sites":
{ Args: Record<PropertyKey, never>; Returns: {
              "avatar_url": string,"category": string,"headline": string,"name": string,"profession": string,"slug": string,"template": string
            }[]
                           },
"publish_website":
{ Args: { "p_note"?: string,"p_website": string }; Returns: Json
                           },
"record_domain_check":
{ Args: { "p_domain_id": string,"p_error"?: string,"p_ssl_status"?: string,"p_verified": boolean }; Returns: {
              "created_at": string,
"domain": string,
"id": string,
"is_primary": boolean,
"last_checked_at": string | null,
"last_error": string | null,
"ssl_status": string,
"status": string,
"type": string,
"updated_at": string,
"verification_token": string,
"verified_at": string | null,
"website_id": string,
"workspace_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "domains"
        isOneToOne: true
        isSetofReturn: false
      } },
"record_site_event":
{ Args: { "p_country": string,"p_device": string,"p_domain": string,"p_event": string,"p_path": string,"p_referrer_host": string,"p_slug": string,"p_visitor_hash": string }; Returns: boolean
                           },
"remove_custom_domain":
{ Args: { "p_domain_id": string }; Returns: undefined
                           },
"reorder_sections":
{ Args: { "p_section_ids": (string)[],"p_website": string }; Returns: undefined
                           },
"restore_website_version":
{ Args: { "p_make_live"?: boolean,"p_version_id": string,"p_website": string }; Returns: undefined
                           },
"unpublish_website":
{ Args: { "p_website": string }; Returns: undefined
                           },
"validate_website_for_publish":
{ Args: { "p_website": string }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
