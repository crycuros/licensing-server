import { Controller, Get, Post, Put, Delete, Body, Param, Query, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { LicenseService, CreateLicenseDto, UpdateLicenseDto } from './license.service';

// Admin API Key - Set this in environment variable or change here
const ADMIN_API_KEY = process.env.LICENSE_ADMIN_KEY || 'MNDProductionBosschito093135.Kimchard@0330';

function validateAdminKey(authorization: string): boolean {
  if (!authorization) return false;
  return authorization.replace('Bearer ', '').trim() === ADMIN_API_KEY;
}

@Controller('api/licenses')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  // GET /api/licenses - List all licenses
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (plan) filters.plan = plan;
    if (search) filters.search = search;

    const licenses = this.licenseService.findAll(filters);
    const stats = this.licenseService.getStats();

    return {
      licenses,
      stats,
    };
  }

  // GET /api/licenses/:id - Get license by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    const license = this.licenseService.findById(id);
    if (!license) {
      throw new HttpException('License not found', HttpStatus.NOT_FOUND);
    }
    return license;
  }

  // POST /api/licenses - Create new license
  @Post()
  create(@Headers('authorization') auth: string, @Body() createLicenseDto: CreateLicenseDto) {
    if (!validateAdminKey(auth)) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!createLicenseDto.customerEmail || !createLicenseDto.plan) {
      throw new HttpException(
        'Customer email and plan are required',
        HttpStatus.BAD_REQUEST
      );
    }

    const license = this.licenseService.create(createLicenseDto);
    return {
      message: 'License created successfully',
      license,
    };
  }

  // PUT /api/licenses - Update license
  @Put()
  update(@Headers('authorization') auth: string, @Body() updateLicenseDto: UpdateLicenseDto) {
    if (!validateAdminKey(auth)) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (!updateLicenseDto.licenseId) {
      throw new HttpException('License ID is required', HttpStatus.BAD_REQUEST);
    }

    const license = this.licenseService.update(updateLicenseDto);
    if (!license) {
      throw new HttpException('License not found', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'License updated successfully',
      license,
    };
  }

  // DELETE /api/licenses/:id - Delete license
  @Delete(':id')
  delete(@Headers('authorization') auth: string, @Param('id') id: string) {
    if (!validateAdminKey(auth)) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const deleted = this.licenseService.delete(id);
    if (!deleted) {
      throw new HttpException('License not found', HttpStatus.NOT_FOUND);
    }

    return {
      message: 'License deleted successfully',
    };
  }

  // POST /api/licenses/validate - Validate license
  @Post('validate')
  validate(@Body() body: { licenseKey: string; domain?: string; action?: string }) {
    if (!body.licenseKey) {
      throw new HttpException('License key is required', HttpStatus.BAD_REQUEST);
    }

    const result = this.licenseService.validate(body.licenseKey, body.domain);
    
    if (!result.valid) {
      throw new HttpException(result, HttpStatus.FORBIDDEN);
    }

    return result;
  }

  // GET /api/licenses/validate - Check if license exists
  @Get('validate/check')
  check(@Query('key') key: string) {
    if (!key) {
      throw new HttpException('License key is required', HttpStatus.BAD_REQUEST);
    }

    const license = this.licenseService.findByKey(key);
    if (!license) {
      throw new HttpException({ exists: false }, HttpStatus.NOT_FOUND);
    }

    return {
      exists: true,
      status: license.status,
      plan: license.plan,
    };
  }
}
