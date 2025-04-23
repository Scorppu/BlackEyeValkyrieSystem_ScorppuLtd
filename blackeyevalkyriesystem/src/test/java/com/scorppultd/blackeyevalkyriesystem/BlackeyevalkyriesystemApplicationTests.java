package com.scorppultd.blackeyevalkyriesystem;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import com.scorppultd.blackeyevalkyriesystem.service.UserService;
import com.scorppultd.blackeyevalkyriesystem.service.DrugService;
import com.scorppultd.blackeyevalkyriesystem.repository.UserRepository;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class BlackeyevalkyriesystemApplicationTests {

	@Autowired
	private ApplicationContext applicationContext;

	@Test
	void contextLoads() {
		// Verify that the context loads properly
		assertNotNull(applicationContext);
	}
	
	@Test
	void servicesLoad() {
		// Verify that key services are initialized
		assertNotNull(applicationContext.getBean(UserService.class));
		assertNotNull(applicationContext.getBean(DrugService.class));
	}
	
	@Test
	void repositoriesLoad() {
		// Verify that repositories are initialized
		assertNotNull(applicationContext.getBean(UserRepository.class));
	}

}
